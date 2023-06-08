const Health = artifacts.require("Health");
const Appointment = artifacts.require("Appointment");

module.exports = function(deployer) {
  deployer.deploy(Health);
  deployer.deploy(Appointment);
};
