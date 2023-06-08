import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import Doctor from "./Pages/Doctor/doctorHome";
import Patient from "./Pages/Patient/patientHome";

function Home() {

  const [role, setRole] = useState();
  
  const navigate = useNavigate();

  useEffect(() => {
      if(!localStorage.getItem('account')) navigate("/");
      setRole(localStorage.getItem('role'));
  }, [navigate]);

  return (
    <>
      {(role==='Doctor') ? <Doctor /> : <Patient />}
    </>
  );
}

export default Home;