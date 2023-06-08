import { useEffect,useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Cont from '../../abis/Health.json'
import { useNavigate } from "react-router-dom";
import Web3 from 'web3';
import './pharmacy.css';
import Alert from 'react-bootstrap/Alert';
import { BiError }from "react-icons/bi";

function ViewPrescription() {

    const [account, setAccount] = useState();
    const [contract, setContract] = useState(null);
    const [addr, setAddr] = useState("");
    const [record, setRecord] = useState([]);
    const [showPending, setShowPending] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const [active, setActive] = useState(1);
    const [doctors, setdoctors] = useState([]);

    const [showAlert, setShowAlert] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
          if(!localStorage.getItem('account') || localStorage.getItem('role')!=='Pharmacy') navigate("/");
          const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
          const accounts = await web3.eth.requestAccounts();
          setAccount(accounts[0]);
    
          const networkId = await web3.eth.net.getId();
          const networkData = Cont.networks[networkId];
          if(networkData) {
            const contract = new web3.eth.Contract(Cont.abi, networkData.address);
            setContract(contract);
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

    const viewPending = async (e) => {
        e.preventDefault();
        setShowAlert(false);
        setShowAll(false);
        setActive(1);
        let prescription = await contract.methods.get_pending_prescriptions(addr).call({ from: account });
        
        let doctor=[];
        for(let i=0;i<prescription.length;i++) {
            let d=await contract.methods.get_doctor(prescription[i].doctor).call({ from: account });
            doctor[i]=d[1];
        }
        setdoctors(doctor);

        if(prescription.length>0) setShowPending(true);
        else setShowAlert(true);
        setRecord(prescription);
        setShowToggle(true);
    };

    const viewAll = async () => {
        setShowAlert(false);
        setShowPending(false);
        setActive(2);
        let prescription = await contract.methods.get_prescriptions(addr).call({ from: account });
        
        let doctor=[];
        for(let i=0;i<prescription.length;i++) {
            let d=await contract.methods.get_doctor(prescription[i].doctor).call({ from: account });
            doctor[i]=d[1];
        }
        setdoctors(doctor);

        if(prescription.length>0) setShowAll(true);
        else setShowAlert(true);
        setRecord(prescription);
    };

    const resolve = async (index) => {
        await contract.methods.resolve_prescription(addr,index).send({ from: account });

        let prescription = await contract.methods.get_pending_prescriptions(addr).call({ from: account });

        let doctor=[];
        for(let i=0;i<prescription.length;i++) {
            let d=await contract.methods.get_doctor(prescription[i].doctor).call({ from: account });
            doctor[i]=d[1];
        }
        setdoctors(doctor);

        if(prescription.length===0) {
            setShowPending(false);
            setShowAlert(true);
        }
        setRecord(prescription);
    };

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.clear();
        navigate("/");
    };
  
    return (
        <>
            <div className="bgimage">
                <div className="box_container">
                    <div>
                        <Row>
                            <Col xs={7}>
                            <h1  style={{fontVariant : 'small-caps'}}>Welcome Pharmacist</h1>
                            </Col>
                            <Col xs={5}>
                            <Button style={{float : 'right'}} variant="primary" onClick={handleLogout}>
                                Logout
                            </Button>
                            </Col>
                        </Row>
                    </div>
                    <div  style={{margin : '20px 250px'}}>
                        <Form onSubmit={viewPending}>
                            <div className="contents">
                            <Row>
                                <Col xs={6}>
                                <Form.Control type="text" placeholder="Enter Patient address" onChange={updateAddr}/>
                                </Col>
                                <Col xs="auto">
                                <Button variant="primary" type="submit">
                                    View
                                </Button>
                                </Col>
                            </Row>
                            </div>
                        </Form>
                    </div>
                    {showToggle?
                        <ButtonGroup style={{float : 'right', width : '200px', margin : '0px 150px 20px 0px'}}>
                            <ToggleButton
                                type="radio"
                                variant='outline-success'
                                name="radio"
                                value="1"
                                size="sm"
                                checked={active===1}
                                onClick={viewPending}
                            >
                                Pending
                            </ToggleButton>
                            <ToggleButton
                                type="radio"
                                variant='outline-success'
                                name="radio"
                                value="2"
                                size="sm"
                                checked={active===2}
                                onClick={viewAll}
                            >
                                All
                            </ToggleButton>
                        </ButtonGroup>
                        :<></>
                    }
                    
                    {showPending?
                    <div className="table" style={{height : '350px'}}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Doctor</th>
                            <th>Prescription</th>
                            <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            record.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[0]}</td>
                                <td>{doctors[index]}</td>
                                <td>{item[2]}</td>
                                <td>{item[3]}</td>
                                <td><Button variant="outline-success" size="sm" onClick={()=>resolve(index)}>Resolve</Button></td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    </div>
                    :<></>
                    }
                    
                    {showAlert?
                        <center><Alert variant="danger" style={{width : '350px', marginTop : '150px'}}><BiError size={20}/><span style={{marginLeft : '10px'}}>No prescriptions found</span></Alert></center>
                        :
                        <></>
                    }

                    {showAll?
                    <div className="table" style={{height : '350px'}}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Doctor</th>
                            <th>Prescription</th>
                            <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            record.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[0]}</td>
                                <td>{doctors[index]}</td>
                                <td>{item[2]}</td>
                                <td>{item[3]}</td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    </div>
                    :<></>
                    }
                    
                    
                </div>
            </div>
        </>
         
    );
 }
 
 export default ViewPrescription;