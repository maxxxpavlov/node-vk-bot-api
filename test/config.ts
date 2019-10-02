const sendRequestViaKoa = (ctx, middleware) => {
  middleware.webhookCallback(ctx, () => { });

  return ctx;
};

const sendRequestViaExpress = (ctx, middleware) => {
  middleware.webhookCallback(ctx.req, ctx.res, () => { });

  return ctx;
};

const sendRequest = (type, body, middleware) => {
  const ctx = {
    req: { body },
    request: { body },
    res: {
      end: (body) => {
        ctx.res.body = body;
      },
      body: null
    },
  };

  return type === 'koa'
    ? sendRequestViaKoa(ctx, middleware)
    : sendRequestViaExpress(ctx, middleware);
};

export { sendRequest };
