const cartridge = {
  read: () => 0xff,
  write: () => {}, // 카트리지 쓰기는 일반적으로 무시
};

export default cartridge;
