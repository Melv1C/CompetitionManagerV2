import "@fontsource-variable/geist";
import ReactDOM from "react-dom/client";

import "./styles.css";

function App() {
  return (
    <main>
      <h1>Competition Manager</h1>
      <p>Organization management workspace.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
