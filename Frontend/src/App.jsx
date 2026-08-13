import Header from "./components/common/Header";
import AppRoutes from "./routes/AppRoutes";

function App() {
    return (
        <div
            className="min-h-screen bg-white"
        >
            <div className="min-h-screen bg-white/40 flex flex-col">

                <Header />

                <main className="flex-1">
                    <AppRoutes />
                </main>
            </div>
        </div>
    );
}

export default App;