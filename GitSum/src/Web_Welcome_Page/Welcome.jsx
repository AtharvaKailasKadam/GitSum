import React from "react";
import "./Welcome.css";
import FloatingMarks from "./FloatingMarks";
import logo from "../assets/logo.png";

export const Welcome = () => {
return (
    <>
        <div className="welcome-overlay">
            <FloatingMarks count={12} />
            <div className="welcome-background">
                <div className="welcome-container">
                    <div className="welcome-logo-container">
                        <img className="welcome-logo" src={logo} alt="GitSum Logo" />
                    </div>
                    <h1 className="welcome-title"><u>Welcome to GitSum</u></h1>
                    <p className="welcome-description">Your Codebase Summarizer.</p>
                    <p className="welcome-instruction">Get started by exploring your Codebase and Generating Summaries.</p>
                </div>

                <div className="welcome-button">
                    <button
                    className="get-started-button"
                    onClick={() => (window.location.href = "/login")}
                    >
                    Get Started
                    </button>
                </div>
            </div>
        </div>
    </>
);
};
