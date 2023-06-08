import DoctorSideBar from "../../Components/doctorSideBar";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Cont1 from "../../abis/Health.json";
import Cont2 from "../../abis/Appointment.json";
import Web3 from "web3";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

function ManageAppointments() {
  const [account, setAccount] = useState();
  const [name, setName] = useState("");
  const [healthContract, setHealthContract] = useState(null);
  const [appointmentContract, setAppointmentContract] = useState(null);

  const [time, setTime] = useState("");
  const [requests, setRequests] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [confirmed, setConfirmed] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [idx, setIdx] = useState(null);
  const [reason, setReason] = useState("");
  const [cancel, setCancel] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!localStorage.getItem("account") || localStorage.getItem("role") !== "Doctor") navigate("/");
      const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);

      const networkId = await web3.eth.net.getId();
      const networkData1 = Cont1.networks[networkId];
      const networkData2 = Cont2.networks[networkId];
      if (networkData1) {
        const healthContract = new web3.eth.Contract(Cont1.abi, networkData1.address);
        setHealthContract(healthContract);
        const appointmentContract = new web3.eth.Contract(Cont2.abi, networkData2.address);
        setAppointmentContract(appointmentContract);

        const doctor = await healthContract.methods.get_doctor(accounts[0]).call({ from: accounts[0] });
        setName(doctor[1]);
        const requests = await appointmentContract.methods.get_pending_requests().call({ from: accounts[0] });
        setRequests(requests);
        if (requests.length > 0) setShowTable(true);
        const confirmed = await appointmentContract.methods.get_confirmed_appointments().call({ from: accounts[0] });
        setConfirmed(confirmed);
        if (confirmed.length > 0) setShowConfirm(true);
      } else {
        window.alert("Smart contract not deployed to detected network.");
      }
    }

    load();
  }, [navigate]);

  const updateReason = (e) => {
    e.preventDefault();
    setReason(e.target.value);
  };

  const updateTime = (e) => {
    e.preventDefault();
    var splitTime = e.target.value.split(":");
    var hh = splitTime[0];
    var mm = splitTime[1];

    let AMorPM = "AM";
    if (hh >= 12) AMorPM = "PM";
    hh = hh === "12" ? hh : hh % 12;

    setTime(hh + ":" + mm + " " + AMorPM);
  };

  const handleConfirm = async (index) => {
    if (time === "") {
      window.alert("Select time");
      return;
    }
    let req = requests[index];
    let success = false;
    await appointmentContract.methods
      .confirm_appointment(index, time)
      .send({ from: account })
      .then((r) => {
        success = true;
      });

    if (success) {
      const pat = await healthContract.methods.get_patient(req[2]).call({ from: account });
      let templateParams = {
        subject: "Appointment Confirmation",
        pat_name: req[3],
        pat_email: pat[2],
        message: "Your appointment with " + req[5] + " is confirmed on " + req[0] + " at " + time,
      };
      console.log(templateParams);

      emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams, "YOUR_PUBLIC_KEY").then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );

      const requests = await appointmentContract.methods.get_pending_requests().call({ from: account });
      setRequests(requests);
      if (requests.length === 0) setShowTable(false);
      const confirmed = await appointmentContract.methods.get_confirmed_appointments().call({ from: account });
      setConfirmed(confirmed);
      if (confirmed.length > 0) setShowConfirm(true);
    }
  };

  const handleReject = (index) => {
    setIdx(index);
    setCancel(false);
    setShowModal(true);
  };

  const rejectRequest = async () => {
    let req = requests[idx];
    let success = false;
    await appointmentContract.methods
      .reject_pending_request(idx)
      .send({ from: account })
      .then((r) => {
        success = true;
      });

    if (success) {
      const pat = await healthContract.methods.get_patient(req[2]).call({ from: account });
      let templateParams = {
        subject: "Appointment request rejected",
        pat_name: req[3],
        pat_email: pat[2],
        message: "Your appointment request with " + req[5] + " for " + req[0] + " is rejected. Reason : " + reason,
      };
      console.log(templateParams);

      emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams, "YOUR_PUBLIC_KEY").then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );

      const requests = await appointmentContract.methods.get_pending_requests().call({ from: account });
      setRequests(requests);
      if (requests.length === 0) setShowTable(false);
    }
    setShowModal(false);
  };

  const handleCancel = (index) => {
    setIdx(index);
    setCancel(true);
    setShowModal(true);
  };

  const cancelAppointment = async () => {
    let conf = confirmed[idx];
    let success = false;
    await appointmentContract.methods
      .cancel_confirmed_appointment(idx)
      .send({ from: account })
      .then((r) => {
        success = true;
      });

    if (success) {
      const pat = await healthContract.methods.get_patient(conf[2]).call({ from: account });
      let templateParams = {
        subject: "Appointment cancelled",
        pat_name: conf[3],
        pat_email: pat[2],
        message:
          "Your appointment with " + conf[5] + " on " + conf[0] + " " + conf[1] + " is cancelled. Reason : " + reason,
      };
      console.log(templateParams);

      emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams, "YOUR_PUBLIC_KEY").then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );

      const confirmed = await appointmentContract.methods.get_confirmed_appointments().call({ from: account });
      setConfirmed(confirmed);
      if (confirmed.length === 0) setShowConfirm(false);
    }
    setShowModal(false);
  };

  const handleDone = async (index) => {
    let success = false;

    await appointmentContract.methods
      .mark_as_complete(index)
      .send({ from: account })
      .then((r) => {
        success = true;
      });

    if (success) {
      const confirmed = await appointmentContract.methods.get_confirmed_appointments().call({ from: account });
      setConfirmed(confirmed);
      if (confirmed.length === 0) setShowConfirm(false);
    }
  };

  return (
    <>
      <DoctorSideBar name={name} />
      <div className="main-container">
        <div className="main-body">
          <div>
            <h1 style={{ fontVariant: "small-caps" }}>Appointments</h1>
          </div>
          <center>
            <h4 style={{ fontVariant: "small-caps" }}>Requests</h4>
          </center>
          <div className="table" style={{ height: "200px", marginTop: "0px" }}>
            {showTable ? (
              <>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Patient Name</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item[0]}</td>
                        <td>{item[3]}</td>
                        <td>{item[6]}</td>
                        <td>
                          <Form>
                            <Row style={{ height: "auto" }}>
                              <Col xs="auto">
                                <Form.Control type="time" onChange={updateTime} />
                              </Col>
                              <Col xs="auto">
                                <Button variant="primary" size="sm" onClick={() => handleConfirm(index)}>
                                  {" "}
                                  Confirm{" "}
                                </Button>
                              </Col>
                              <Col xs="auto">
                                <Button variant="outline-danger" size="sm" onClick={() => handleReject(index)}>
                                  {" "}
                                  Reject{" "}
                                </Button>
                              </Col>
                            </Row>
                          </Form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : (
              <center style={{ fontStyle: "italic", marginTop: "10px" }}>No requests...</center>
            )}
          </div>

          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{cancel === true ? <>Cancel Appointment</> : <>Reject Request</>}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control as="textarea" rows={2} onChange={updateReason} />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              {cancel === true ? (
                <Button variant="danger" onClick={cancelAppointment}>
                  Cancel Appointment
                </Button>
              ) : (
                <Button variant="danger" onClick={rejectRequest}>
                  Reject
                </Button>
              )}
            </Modal.Footer>
          </Modal>

          <center>
            <h4 style={{ fontVariant: "small-caps", marginTop: "20px" }}>Confirmed</h4>
          </center>
          <div className="table" style={{ height: "200px", marginTop: "0px" }}>
            {showConfirm ? (
              <>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient Name</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmed.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item[0]}</td>
                        <td>{item[1]}</td>
                        <td>{item[3]}</td>
                        <td>{item[6]}</td>
                        <td>
                          <Row style={{ height: "auto" }}>
                            <Col xs="auto">
                              <Button variant="outline-danger" size="sm" onClick={() => handleCancel(index)}>
                                {" "}
                                Cancel{" "}
                              </Button>
                            </Col>
                            <Col xs="auto">
                              <Button variant="outline-success" size="sm" onClick={() => handleDone(index)}>
                                {" "}
                                Done{" "}
                              </Button>
                            </Col>
                          </Row>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : (
              <center style={{ fontStyle: "italic", marginTop: "10px" }}>No confirmed appointments...</center>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ManageAppointments;
