//root level items
export const BASE_PADDING = 12;

//additional padding per nesting level
export const LEVEL_PADDING = 12;

export const getItemPadding = (level: number, isFile: boolean) => {
  //files need extra padding since they dont have chevron(>)
  const fileOffset = isFile ? 16 : 0;
  return BASE_PADDING + level * LEVEL_PADDING + fileOffset;
};
