// import { useEffect } from 'react';
import { BsClipboard2Data }from "react-icons/bs";
// import { GiStethoscope }from "react-icons/gi";
import { TbStethoscope }from "react-icons/tb";
import { MdOutlineManageAccounts }from "react-icons/md";
import { FaUserCircle }from "react-icons/fa";
import { BiLogOut }from "react-icons/bi";
import { NavLink } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import './sidebar.css'

function PatientSideBar(props) {

    const navigate = useNavigate();

    const menuItem=[
        {
            path:"/myrecords",
            name:"My Records",
            icon:<BsClipboard2Data />
        },
        {
            path:"/appointment",
            name:"Appointment",
            icon:<TbStethoscope />
        },
        {
            path:"/manageaccess",
            name:"Manage Access",
            icon:<MdOutlineManageAccounts />
        }
    ]

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.clear();
        navigate("/");
    };

    return (
        <div className="sidebar">
            <div className="sidebar_contents">
            <div className="top_section">
            <FaUserCircle />
               <div className="username">{props.name}</div>
            </div>
           {
               menuItem.map((item, index)=>(
                   <div key={index} className="row">
                        <NavLink to={item.path} key={index} className={(navData) => (navData.isActive ? "active" : "inactive")}>
                            <div className="icon">{item.icon}</div>
                            <div className="link_text"><span style={{fontVariant : 'small-caps'}}>{item.name}</span></div>
                        </NavLink>
                   </div>
               ))
           }
           <div className="row">
                <a className="logout" href="/#" onClick={handleSubmit}>
                    <div className="icon"><BiLogOut /></div>
                    <div className="link_text"><span style={{fontVariant : 'small-caps'}}>Logout</span></div>
                </a>
            </div>
            </div>
        </div>
    );
};

export default PatientSideBar;