// Duplicado de /admin/live con el mismo filtro anti-bot y clasificación de fuentes.
// Ruta alterna para uso analítico sin afectar el panel operativo en vivo.
import AdminLive from "./AdminLive";

const AdminAnalytics = () => <AdminLive />;

export default AdminAnalytics;
