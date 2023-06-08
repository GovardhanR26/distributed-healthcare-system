import DoctorSideBar from "../../Components/doctorSideBar";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";
import { BiError } from "react-icons/bi";
import emailjs from "@emailjs/browser";
import Cont from "../../abis/Health.json";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";

function ViewRecords() {
  const [account, setAccount] = useState();
  const [contract, setContract] = useState(null);
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [record, setRecord] = useState([]);
  const [patName, setPatName] = useState("");
  const [showTable, setShowTable] = useState(false);

  const [showAlert, setShowAlert] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    let plist = await contract.methods.get_accessible_patients().call({ from: account });
    let patient = [];
    try {
      patient = await contract.methods.get_patient(addr).call({ from: account });
    } catch (error) {
      console.log(error);
    }
    if (!plist.includes(addr)) {
      setShowTable(false);
      setShowAlert(true);

      if (patient.length !== 0) {
        let templateParams = {
          subject: "Requesting access",
          pat_name: patient[0],
          pat_email: patient[2],
          message:
            name +
            " is requesting access to your medical records. To grant access, go to Manage Access section and use the address " +
            localStorage.getItem("account"),
        };
        console.log(templateParams);

        emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams, "YOUR_PUBLIC_KEY").then(
          (result) => {
            console.log(result.text);
            e.target.reset();
          },
          (error) => {
            console.log(error.text);
          }
        );
      }
    } else {
      setShowAlert(false);
      let records = await contract.methods.get_patient_records(addr).call({ from: account });
      if (records.length > 0) setShowTable(true);
      setRecord(records);
      setPatName(patient[0]);
    }

    e.target.reset();
  };

  return (
    <>
      <DoctorSideBar name={name} />
      <div className="main-container">
        <div className="main-body">
          <div>
            <h1 style={{ fontVariant: "small-caps" }}>View Records</h1>
          </div>
          <div style={{ margin: "50px 180px 0px 180px" }}>
            <Form onSubmit={handleSubmit}>
              <div className="contents">
                <Row>
                  <Col xs={7}>
                    <Form.Control type="text" placeholder="Enter address" onChange={updateAddr} />
                  </Col>
                  <Col xs="auto">
                    <Button variant="primary" type="submit">
                      View
                    </Button>
                  </Col>
                </Row>
              </div>
            </Form>
            {showTable ? (
              <center>
                <span style={{ fontWeight: "bold" }}>Patient name :</span> {patName}
              </center>
            ) : (
              <></>
            )}
          </div>
          {showAlert ? (
            <Alert variant="danger">
              <BiError size={20} />
              <span style={{ marginLeft: "10px" }}>You do not have access to this patient records</span>
            </Alert>
          ) : (
            <></>
          )}

          {showTable ? (
            <div className="table" style={{ height: "300px", marginTop: "20px" }}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Diagnosis</th>
                    <th>Treatment</th>
                    <th>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {record.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item[0]}</td>
                      <td>{item[2]}</td>
                      <td>{item[3]}</td>
                      <td>
                        {item[5].map((l, i) => (
                          <a href={l} key={i} target="_blank" rel="noreferrer noopener">
                            File {i}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
}

export default ViewRecords;
