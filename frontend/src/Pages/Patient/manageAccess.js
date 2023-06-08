import PatientSideBar from "../../Components/patientSideBar";
import { useEffect,useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import Cont from '../../abis/Health.json'
import Web3 from 'web3';
import { useNavigate } from "react-router-dom";

function ManageAccess() {

    const [account, setAccount] = useState();
    const [contract, setContract] = useState(null);

    const [patName, setPatName] = useState("");
    const [addr, setAddr] = useState("");
    const [name, setName] = useState("");
    const [hospital, setHospital] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [permittedDoctors, setPermittedDoctors] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [grantbtn, setGrantbtn] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
          if(!localStorage.getItem('account') || localStorage.getItem('role')!=='Patient') navigate("/");
          const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
          const accounts = await web3.eth.requestAccounts();
          setAccount(accounts[0]);
    
          const networkId = await web3.eth.net.getId();
          const networkData = Cont.networks[networkId];
          if(networkData) {
            const contract = new web3.eth.Contract(Cont.abi, networkData.address);
            setContract(contract);

            const patient = await contract.methods.get_patient(accounts[0]).call({ from: accounts[0] });
            setPatName(patient[0]);
            let dlist = await contract.methods.get_permitted_doctors().call({ from: accounts[0] });
            if(dlist.length>0) setShowTable(true);
            for(let i=0;i<dlist.length;i++) {
                let doctor = await contract.methods.get_doctor(dlist[i]).call({ from: accounts[0] });
                setPermittedDoctors((prev) => prev.some(p => p[0] === doctor[0])?[...prev]:[...prev,doctor]);
            }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        let dlist = await contract.methods.get_permitted_doctors().call({ from: account });
        
        if(dlist.includes(addr)) {
            setGrantbtn(false);
            window.alert("Already granted");
        }
        else {
            let doctor = await contract.methods.get_doctor(addr).call({ from: account });
            setName(doctor[1])
            setHospital(doctor[2])
            setSpecialization(doctor[3])
            setGrantbtn(true);
        }
        
        e.target.reset();
    };

    const grantAccess = async (e) => {
        e.preventDefault();
        await contract.methods.permit_access(addr).send({ from: account }).then((r) => {
            console.log("granted");
        })
        let doctor = await contract.methods.get_doctor(addr).call({ from: account });
        setPermittedDoctors((prev) => [...prev,doctor]);
        setGrantbtn(false);
        setShowTable(true);
    };

    const revokeAccess = async (addr) => {
        // e.preventDefault();
        await contract.methods.revoke_access(addr).send({ from: account }).then((r) => {
            console.log("revoked");
        })

        setPermittedDoctors((current) => current.filter((p) => p[0] !== addr));
        console.log(addr)
        if(permittedDoctors.length===1) setShowTable(false);
    };
  
    return (
        <>
            <PatientSideBar name={patName}/>
            <div className="main-container">
                <div className="main-body">
                    <div>
                        <h1 style={{fontVariant : 'small-caps'}}>Manage Access</h1>
                    </div>
                    <div className="main-contents">
                        {grantbtn?
                        <div className="confirm_box">
                            <Row>
                                <Col xs="auto">
                                <ul style={{listStyleType : 'none'}}>
                                    <li>Doctor Name : {name}</li>
                                    <li>Hospital : {hospital}</li>
                                    <li>Specialization : {specialization}</li>
                                </ul>
                                </Col>
                                <Col xs="auto">
                                    <Row>
                                    <Button variant="success" onClick={grantAccess}>Confirm</Button>
                                    </Row>
                                    <Row>
                                    <Button variant="outline-danger" onClick={()=>setGrantbtn(false)}>Cancel</Button>
                                    </Row>
                                </Col>
                            </Row>
                        </div>
                        :
                        <Form onSubmit={handleSubmit}>
                            <div className="contents">
                            <Row>
                                <Col xs={7}>
                                <Form.Control type="text" placeholder="Enter address" onChange={updateAddr}/>
                                </Col>
                                <Col xs="auto">
                                <Button variant="primary" type="submit">
                                    Grant Access
                                </Button>
                                </Col>
                            </Row>
                            </div>
                        </Form>
                        }
                    </div>
                    <div className="table"  style={{height : '250px'}}>
                    {showTable?
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Doctor Name</th>
                            <th>Hospital</th>
                            <th>Specialization</th>
                            <th>Revoke Access</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            permittedDoctors.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[1]}</td>
                                <td>{item[2]}</td>
                                <td>{item[3]}</td>
                                <td><Button variant="outline-danger" size="sm" onClick={()=>revokeAccess(item[0])}>Revoke</Button></td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    :<></>
                    }
                    </div>
                </div>
            </div>
        </>
         
    );
 }
 
 export default ManageAccess;