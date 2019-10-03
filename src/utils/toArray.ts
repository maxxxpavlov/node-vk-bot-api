const toArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [value];
};

export { toArray };
