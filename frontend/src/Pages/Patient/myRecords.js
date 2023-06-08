import PatientSideBar from "../../Components/patientSideBar";
import { useEffect,useState } from 'react';
import Table from 'react-bootstrap/Table';
import Cont from '../../abis/Health.json'
import Web3 from 'web3';
import { useNavigate } from "react-router-dom";

function MyRecords() {

    // const [account, setAccount] = useState();
    // const [contract, setContract] = useState(null);

    const [showTable, setShowTable] = useState(false);
    const [data, setData] = useState([]);
    const [doctors, setdoctors] = useState([]);
    const [name, setName] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
          if(!localStorage.getItem('account') || localStorage.getItem('role')!=='Patient') navigate("/");
          const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
          const accounts = await web3.eth.requestAccounts();
        //   setAccount(accounts[0]);
    
          const networkId = await web3.eth.net.getId();
          const networkData = Cont.networks[networkId];
          if(networkData) {
            const contract = new web3.eth.Contract(Cont.abi, networkData.address);
            // setContract(contract);
            const patient = await contract.methods.get_patient(accounts[0]).call({ from: accounts[0] });
            setName(patient[0]);
            let data = await contract.methods.get_patient_records(accounts[0]).call({ from: accounts[0] });
            let doctor=[];
            for(let i=0;i<data.length;i++) {
                let d=await contract.methods.get_doctor(data[i].doctor).call({ from: accounts[0] });
                doctor[i]=d[1];
            }
            if(data.length>0) setShowTable(true);
            setData(data);
            setdoctors(doctor);
          } else {
            window.alert('Smart contract not deployed to detected network.')
          }
        }
        
        load();
    }, [navigate]);
  
   return (
    <>
        <PatientSideBar name={name}/>
        <div className="main-container">
            <div className="main-body">
                <div>
                    <h1 style={{fontVariant : 'small-caps'}}>My Records</h1>
                </div>
                <div style={{margin : '50px 0px'}}>
                    {showTable?
                    <div className="table" style={{height : '400px'}}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Doctor Name</th>
                            <th>Diagnosis</th>
                            <th>Treatment</th>
                            <th>Files</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            data.map((item,index) => 
                            <tr key={index}>
                                <td>{index+1}</td>
                                <td>{item[0]}</td>
                                <td>{doctors[index]}</td>
                                <td>{item[2]}</td>
                                <td>{item[3]}</td>
                                <td>{item[5].map((l,i) => <a href={l} key={i} target="_blank" rel="noreferrer noopener">File {i}</a>)}</td>
                            </tr>
                            )}
                        </tbody>
                    </Table>
                    </div>
                    :<></>
                    }
                </div>
            </div>
        </div>
    </>               
        
   );
}

export default MyRecords;