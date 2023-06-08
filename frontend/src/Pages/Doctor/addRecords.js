import DoctorSideBar from "../../Components/doctorSideBar";
import { useEffect, useState } from "react";
import { create } from "ipfs-http-client";
import Web3 from "web3";
import { Buffer } from "buffer";
import Cont from "../../abis/Health.json";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import { BiError } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

const projectId = "YOUR_PROJECT_ID";
const projectSecret = "YOUR_PROJECT_SECRET";
const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

const client = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

function AddRecords() {
  const [account, setAccount] = useState();
  const [contract, setContract] = useState(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);

  const [addr, setAddr] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");

  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!localStorage.getItem("account") || localStorage.getItem("role") !== "Doctor") navigate("/");
      const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
      const accounts = await web3.eth.requestAccounts();
      setAccount(accounts[0]);

      const networkId = await web3.eth.net.getId();
      const networkData = Cont.networks[networkId];
      if (networkData) {
        const contract = new web3.eth.Contract(Cont.abi, networkData.address);
        setContract(contract);
        const doctor = await contract.methods.get_doctor(accounts[0]).call({ from: accounts[0] });
        setName(doctor[1]);
      } else {
        window.alert("Smart contract not deployed to detected network.");
      }
    }

    load();
  }, [navigate]);

  const updateAddr = (e) => {
    e.preventDefault();
    setAddr(e.target.value);
  };

  const updateDiagnosis = (e) => {
    e.preventDefault();
    setDiagnosis(e.target.value);
  };

  const updateTreatment = (e) => {
    e.preventDefault();
    setTreatment(e.target.value);
  };

  const updatePrescription = (e) => {
    e.preventDefault();
    setPrescription(e.target.value);
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(Buffer(reader.result));
    };

    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addr.length === 0 || diagnosis.length === 0) {
      window.alert("Text cannot be empty");
    } else {
      var today = new Date();
      var date = today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      let dateTime = date + " " + time;

      try {
        let url = [];
        if (file != null) {
          const created = await client.add(file);
          const fileUrl = `https://smarthealth.infura-ipfs.io/ipfs/${created.path}`;
          url.push(fileUrl);
          console.log(url);
        }

        contract.methods
          .add_patient_record(addr, dateTime, diagnosis, treatment, prescription, url)
          .send({ from: account })
          .then((r) => {
            console.log("record added");
          });
        setDiagnosis("");
        setTreatment("");
        setPrescription("");
        setFile(null);
        e.target.reset();
      } catch (error) {
        setShowAlert(true);
        setAlertMsg(error.message);
        console.log(error.message);
      }
    }
  };

  return (
    <>
      <DoctorSideBar name={name} />
      <div className="main-container">
        <div className="main-body">
          <div>
            <h1 style={{ fontVariant: "small-caps" }}>Add Records</h1>
          </div>
          <div style={{ margin: "50px 80px" }}>
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} className="mb-3" controlId="formBasicAddr">
                  <Form.Label>Patient Address :</Form.Label>
                  <Form.Control type="text" autoComplete="off" onChange={updateAddr} />
                </Form.Group>

                <Form.Group as={Col} className="mb-3" controlId="formBasicDiag">
                  <Form.Label>Diagnosis :</Form.Label>
                  <Form.Control type="text" autoComplete="off" onChange={updateDiagnosis} />
                </Form.Group>
              </Row>
              <Row style={{ marginBottom: "65px" }}>
                <Form.Group as={Col} className="mb-3" controlId="formBasicTreat">
                  <Form.Label>Treatment details :</Form.Label>
                  <Form.Control as="textarea" rows="3" onChange={updateTreatment} />
                </Form.Group>
              </Row>
              <Row style={{ marginBottom: "80px" }}>
                <Form.Group as={Col} className="mb-3" controlId="formBasicPres">
                  <Form.Label>Prescription :</Form.Label>
                  <Form.Control as="textarea" rows="3" onChange={updatePrescription} />
                </Form.Group>

                <Form.Group as={Col} className="mb-3" controlId="formBasicFile">
                  <Form.Label>Upload File</Form.Label>
                  <Form.Control type="file" onChange={retrieveFile} />
                </Form.Group>
              </Row>
              <center>
                <Button className="mt-2 mb-2" variant="primary" type="submit">
                  Submit
                </Button>
              </center>
              {showAlert ? (
                <Alert variant="danger">
                  <BiError size={20} />
                  <span style={{ marginLeft: "10px" }}>{alertMsg}</span>
                </Alert>
              ) : (
                <></>
              )}
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddRecords;
