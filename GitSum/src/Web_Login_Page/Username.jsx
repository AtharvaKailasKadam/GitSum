import React from "react";
import "./Username.css";
import FloatingMarks from "../Web_Welcome_Page/FloatingMarks";
import AnimatedGithubSymbol from "../assets/AnimatedGithubSumbol.png";

export const EnterUserName = () => {
    return (
        <div className="Username-Overlay">
            <FloatingMarks count={12} />
            <div className="Username-Container">
                <div className="Image-Container">
                    <img className="Username-Image" src={AnimatedGithubSymbol} alt="User Icon"/>
                </div>
                <h1 className="Username-Heading">Enter Username...!</h1>
                <input type="text" className="Username-Input" placeholder="Username"/>
            </div>
        </div>
    );
};

export default EnterUserName