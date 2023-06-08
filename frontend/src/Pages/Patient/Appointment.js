import PatientSideBar from "../../Components/patientSideBar";
import { useEffect,useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import Cont1 from '../../abis/Health.json'
import Cont2 from '../../abis/Appointment.json'
import Web3 from 'web3';
import { useNavigate } from "react-router-dom";

function Appointment() {

    const [account, setAccount] = useState();
    const [healthContract, setHealthContract] = useState(null);
    const [appointmentContract, setAppointmentContract] = useState(null);

    const [name, setName] = useState("");
    const [addr, setAddr] = useState("");
    const [date, setDate] = useState("");
    const [requests, setRequests] = useState([]);
    const [confirmed, setConfirmed] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
          if(!localStorage.getItem('account') || localStorage.getItem('role')!=='Patient') navigate("/");
          const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
          const accounts = await web3.eth.requestAccounts();
          setAccount(accounts[0]);
    
          const networkId = await web3.eth.net.getId();
          const networkData1 = Cont1.networks[networkId];
          const networkData2 = Cont2.networks[networkId];
          if(networkData1) {
            const healthContract = new web3.eth.Contract(Cont1.abi, networkData1.address);
            setHealthContract(healthContract);
            const appointmentContract = new web3.eth.Contract(Cont2.abi, networkData2.address);
            setAppointmentContract(appointmentContract);

            const patient = await healthContract.methods.get_patient(accounts[0]).call({ from: accounts[0] });
            setName(patient[0]);
            const requests = await appointmentContract.methods.patient_get_pending_requests().call({ from: accounts[0] });
            setRequests(requests)
            if(requests.length>0) setShowTable(true);
            const confirmed = await appointmentContract.methods.patient_get_confirmed_appointments().call({ from: accounts[0] });
            setConfirmed(confirmed)
            if(confirmed.length>0) setShowConfirm(true);
          } else {
            window.alert('Smart contract not deployed to detected network.')
          }
        }
        
        load();
    }, [navigate]);

    const updateAddr = (e) => {
        e.preventDefault();
        setAddr(e.target.value);
    };

    const updateDate = (e) => {
        e.preventDefault();
        var splitDate = e.target.value.split('-');
        var year = splitDate[0];
        var month = splitDate[1];
        var day = splitDate[2]; 
        // console.log(day + '-' + month + '-' + year);
        setDate(day + '-' + month + '-' + year);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let patient = await healthContract.methods.get_patient(account).call({ from: account });
        let doctor = await healthContract.methods.get_doctor(addr).call({ from: account });
        if(doctor[1]==="") window.alert('Doctor does not exist')
        else {
            await appointmentContract.methods.request_appointment(patient[0],doctor[1],date,addr).send({ from: account }).then((r) => {
                console.log("Request sent");
            })
            const requests = await appointmentContract.methods.patient_get_pending_requests().call({ from: account });
            setRequests(requests)
            setShowTable(true)
        }       
        e.target.reset();
    };

    const cancelPending = async (index) => {
        await appointmentContract.methods.patient_delete_pending_request(index).send({ from: account }).then((r) => {
            console.log("Cancelled Pending");
        })
        const requests = await appointmentContract.methods.patient_get_pending_requests().call({ from: account });
        setRequests(requests);
        if(requests.length===0) setShowTable(false);
    };

    const cancelConfirmed = async (index) => {
        await appointmentContract.methods.patient_cancel_confirmed_appointment(index).send({ from: account }).then((r) => {
            console.log("Cancelled Appointment");
        })
        const confirmed = await appointmentContract.methods.patient_get_confirmed_appointments().call({ from: account });
        setConfirmed(confirmed)
        if(confirmed.length===0) setShowConfirm(false);
    };

  
    return (
        <>
            <PatientSideBar name={name}/>
            <div className="main-container">
                <div className="main-body">
                    <div>
                        <h1 style={{fontVariant : 'small-caps'}}>Appointment</h1>
                    </div>
                    <div style={{margin : '20px 100px'}}>
                        <Form onSubmit={handleSubmit}>
                            <div className="">
                            <Row>
                                <Col xs={6}>
                                <Form.Control type="text" placeholder="Enter address" onChange={updateAddr}/>
                                </Col>
                                <Col xs="auto">
                                <Form.Control type="date" onChange={updateDate}/>
                                </Col>
                                <Col xs="auto">
                                <Button variant="primary" type="submit">
                                    Request Appointment
                                </Button>
                                </Col>
                            </Row>
                            </div>
                        </Form>
                    </div>
                    
                    {showTable?
                    <>
                    <center><h4  style={{fontVariant : 'small-caps'}}>Requests</h4></center>
                    <div className="table" style={{height : '150px', marginTop : '0px'}}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Doctor Name</th>
                            <th>Status</th>
                            <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            requests.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[0]}</td>
                                <td>{item[1]}</td>
                                <td>{item[5]}</td>
                                <td>{item[6]}</td>
                                <td><Button variant="outline-danger" size="sm" onClick={()=>cancelPending(index)}>Cancel</Button></td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    </div>
                    </>
                    :<></>
                    }
                    

                    {showConfirm?
                    <>
                    <center><h4  style={{fontVariant : 'small-caps', marginTop : '20px'}}>Confirmed</h4></center>
                    <div className="table" style={{height : '150px'}}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Doctor Name</th>
                            <th>Status</th>
                            <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            confirmed.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[0]}</td>
                                <td>{item[1]}</td>
                                <td>{item[5]}</td>
                                <td>{item[6]}</td>
                                <td><Button variant="outline-danger" size="sm" onClick={()=>cancelConfirmed(index)}>Cancel</Button></td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    </div>
                    </>
                    :<></>
                    }
                    
                </div>
            </div>
        </>
    );
 }
 
 export default Appointment;