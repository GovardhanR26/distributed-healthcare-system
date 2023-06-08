import { useEffect, useState } from 'react';
import DoctorSideBar from "../../Components/doctorSideBar";
import '../container.css'
import Web3 from 'web3';
import Cont from '../../abis/Health.json'

function Doctor() {

    const [account, setAccount] = useState();
    const [name, setName] = useState("");    

    useEffect(() => {
      async function load() {
        const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3.eth.net.getId();
        const networkData = Cont.networks[networkId];
        if(networkData) {
          const contract = new web3.eth.Contract(Cont.abi, networkData.address);
          const doctor = await contract.methods.get_doctor(accounts[0]).call({ from: accounts[0] });
          setName(doctor[1]);
        } else {
          window.alert('Smart contract not deployed to detected network.')
        }
      }
      
      load();
     }, []);

    return (
      <>
        <DoctorSideBar name={name}/>
        <div className="main-container">
          <div className="main-body">
            <h1>Doctor Home</h1>
            <div>Hello {name} - {account}</div>
          </div>
        </div>
      </>
    );
}
  
export default Doctor;