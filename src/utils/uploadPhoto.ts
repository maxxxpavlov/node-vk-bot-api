import axios from 'axios';
import FormData from 'form-data';

export function uploadPhoto(bot: any, peerId: number, files: Buffer[]) {
  const uploads = [];
  for (const file of files) {
    uploads.push(bot.execute('photos.getMessagesUploadServer', {
      peer_id: peerId,
    }).then((response: any) => {
      const { upload_url } = response;
      const form = new FormData();
      form.append('photo', file, {
        filename: 'photo.png',
        contentType: 'image/png',
      });

      return axios.post(upload_url, form, {
        headers: form.getHeaders(),
      });
    }).then(({ data }) => {
      return bot.execute('photos.saveMessagesPhoto', data).then(([response]) => {
        return response;
      });
    }));
  }
  return Promise.all(uploads);
}
