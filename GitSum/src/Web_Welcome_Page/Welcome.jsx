import React from "react";
import "./Welcome.css";

export const Welcome = () => {
return (
    <>
        <div className="welcome-background">
            <div className="welcome-container">
                <h1 className="welcome-title">Welcome to GitSum</h1>
                <p className="welcome-description">Your AI-powered code summarization tool.</p>
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
    </>
);
};
