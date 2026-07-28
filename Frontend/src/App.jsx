import AppRoutes from "./routes/AppRoutes";
import backgroundImage from "./assets/images/vec_background.jpg";

function App() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="min-h-screen bg-black/45">
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;