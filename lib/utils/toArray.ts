export default (value: any): any[] => {
  return Array.isArray(value) ? value : [value];
};

