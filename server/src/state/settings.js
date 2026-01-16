let maintenance = false;

module.exports = {
  getMaintenance() {
    return maintenance;
  },
  setMaintenance(val) {
    maintenance = !!val;
  }
};
