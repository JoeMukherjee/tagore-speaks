// src/App.tsx
import ChatContainer from "./components/Chat/ChatContainer";
import Header from "./components/Header";
import { ThemeProvider } from "./theme/ThemeContext";
import { useTheme } from "./theme/useTheme";

// Wrapped component that has access to theme
const AppContent: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div
            className="flex flex-col h-screen mx-auto"
            style={{ backgroundColor: theme.colors.background.DEFAULT }}
        >
            {/* Use the Header component */}
            <Header />

            {/* Main content area with padding to account for fixed header */}
            <div className="flex-1 overflow-auto pt-20">
                <ChatContainer />
            </div>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
