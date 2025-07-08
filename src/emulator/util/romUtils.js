export const extractGameTitle = (romData) => {
  let title = "";
  for (let i = 0x134; i < 0x143; i++) {
    const char = romData[i];
    if (char === 0) break;
    title += String.fromCharCode(char);
  }
  return title.trim();
};
