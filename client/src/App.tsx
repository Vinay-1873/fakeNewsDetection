import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/theme';
import { Toaster } from 'react-hot-toast';

function LandingPage() {
	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />
			<Home />
			<Footer />
		</>
	);
}

function ThemedToaster() {
	const { isDark } = useTheme();

	return (
		<Toaster
			position='top-right'
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
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route path="/profile" element={<Profile />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}
export default App;