import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Analyze from './pages/Analyze';
import { ThemeProvider, useTheme } from './context/theme';
import { getValidSession } from './utils/session';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
	const session = getValidSession();
	const isLoggedIn = Boolean(session?.user && localStorage.getItem('verilens_token'));

	if (!isLoggedIn) {
		return <Navigate to='/login' replace />;
	}

	return children;
}

function LandingPage() {
	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			<Home />
			<Footer />
		</>
	);
}

function AppRoutes() {
	const { pathname } = useLocation();
	const showNavbar = pathname !== '/profile';

	return (
		<>
			{showNavbar && <Navbar />}
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/analyze' element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
				<Route path='/login' element={<Login />} />
				<Route path='/signup' element={<Signup />} />
				<Route path='/profile' element={<Profile />} />
			</Routes>
		</>
	);
}

function ThemedToaster() {
	const { isDark } = useTheme();

	return (
		<Toaster
			position='top-center'
			containerStyle={{ top: 88 }}
			toastOptions={{
				style: {
					background: isDark ? '#0f172a' : '#ffffff',
					color: isDark ? '#e2e8f0' : '#0f172a',
					border: isDark
						? '1px solid rgba(148, 163, 184, 0.25)'
						: '1px solid rgba(15, 23, 42, 0.12)',
				},
			}}
		/>
	);
}

function App() {
	return (
		<ThemeProvider>
			<ThemedToaster />
			<BrowserRouter>
				<AppRoutes />
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;