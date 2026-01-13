import React from "react";
import "./Username.css";
import FloatingMarks from "../Web_Welcome_Page/FloatingMarks";
import AnimatedGithubSymbol from "../assets/AnimatedGithubSymbol.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const EnterUserName = () => {
    const navigate = useNavigate();

    const [userName , setUserName] = useState("");

    const handleSummarizeButtonClick =()=>
    {
        if(userName.trim() === "")
        {
            alert("Please Enter a Valid Username....!");
            return;
        }
        navigate(`/profile/${userName}`);
    };

    return (
        <div className="Username-Overlay">
            <FloatingMarks count={12} />
            <div className="Username-Container">
                <div className="Image-Container">
                    <img className="Username-Image" src={AnimatedGithubSymbol} alt="User Icon"/>
                </div>
                <h1 className="Username-Heading">Enter Username...!</h1>
                <input type="text" className="Username-Input" placeholder="Enter Your Account Username" value={userName} onChange={(e) => setUserName(e.target.value)}/>
                <div className="Username-Button-Container">
                    <button className="Username-Button" onClick={handleSummarizeButtonClick} >Summarize</button>
                </div>
            </div>
        </div>
    );
};

export default EnterUserName