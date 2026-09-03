import { useEffect, useState } from "react";

import Header from "./components/common/header";
import AppRoutes from "./routes/AppRoutes";
import DesktopOnly from "./components/common/DesktopOnly";
import Boot from "./components/common/boot";
import useOnlineStatus from "./hooks/useOnlineStatus";

function App() {
    const isOnline = useOnlineStatus();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <DesktopOnly>

            {/* Boot / Offline screen */}
            <Boot
                isLoaded={isLoaded}
                isOffline={!isOnline}
            />

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