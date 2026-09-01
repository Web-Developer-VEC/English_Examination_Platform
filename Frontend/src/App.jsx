import Header from "./components/common/header";
import AppRoutes from "./routes/AppRoutes";
import DesktopOnly from "./components/common/DesktopOnly";

function App() {
    return (
        <DesktopOnly>
            <div className="min-h-screen bg-white">
                <div className="min-h-screen bg-white/40 flex flex-col">

                    <Header />

                    <main className="flex-1 pt-[160px]">
                        <AppRoutes />
                    </main>

                </div>
            </div>
        </DesktopOnly>
    );
}

export default App;