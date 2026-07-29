import Header from "./components/common/Header";
import AppRoutes from "./routes/AppRoutes";

import backgroundImage from "./assets/images/college-bg.jpg";

function App() {
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed"
            style={{
                backgroundImage: `url(${backgroundImage})`,
            }}
        >
            <div className="min-h-screen bg-black/40 flex flex-col">

                <Header />

                <main className="flex-1">
                    <AppRoutes />
                </main>
            </div>
        </div>
    );
}

export default App;