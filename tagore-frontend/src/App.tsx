// src/App.tsx
import ChatContainer from "./components/Chat/ChatContainer";
import Header from "./components/Header";
import "./App.css";

function App() {
    return (
        <div className="bg-white flex flex-col h-screen mx-auto">
            {/* Use the Header component */}
            <Header />

            {/* Main content area with padding to account for fixed header */}
            <div className="flex-1 overflow-auto">
                <ChatContainer />
            </div>
        </div>
    );
}

export default App;
