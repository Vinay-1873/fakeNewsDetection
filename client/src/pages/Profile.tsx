import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CameraIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cropper, { type Area } from 'react-easy-crop';
import Brand from '../components/Brand';
import SoftBackdrop from '../components/SoftBackdrop';
import { GhostButton, PrimaryButton } from '../components/Buttons';
import { useTheme } from '../context/theme';

interface SessionUser {
    full_name: string;
    email: string;
    profile_image?: string | null;
    subscription_plan?: 'starter' | 'pro' | 'ultra';
}

interface SessionData {
    user?: SessionUser;
    tokenType?: string;
}

interface AuthResponse {
    access_token: string;
    token_type: string;
    user: SessionUser;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8001';

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', () => reject(new Error('Could not load image.')));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}

async function getCroppedImageDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas is not available.');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
}

export default function Profile() {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdatingPic, setIsUpdatingPic] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1.2);
    const [cropAspect, setCropAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isDark } = useTheme();

    useEffect(() => {
        const rawSession = localStorage.getItem('verilens_session');
        if (!rawSession) {
            toast.error('Please log in to access your profile.');
            navigate('/login');
            return;
        }

        try {
            const session = JSON.parse(rawSession) as SessionData;
            if (!session.user) {
                toast.error('Session not found. Please log in again.');
                navigate('/login');
                return;
            }
            setUser(session.user);
        } catch {
            toast.error('Session is invalid. Please log in again.');
            navigate('/login');
            return;
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('verilens_token');
        if (!token) {
            return;
        }

        const refreshCurrentUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };
                if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
                    handleExpiredSession();
                    return;
                }

                if (!response.ok || !payload.access_token || !payload.user || !payload.token_type) {
                    return;
                }

                syncSession(payload as AuthResponse);
            } catch {
                // Keep current session state when background refresh fails.
            }
        };

        void refreshCurrentUser();
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('verilens_token');
        if (!token) {
            return;
        }

        const syncSubscriptionPlan = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/billing/sync-subscription-plan`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };
                if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
                    handleExpiredSession();
                    return;
                }

                if (!response.ok || !payload.access_token || !payload.user || !payload.token_type) {
                    return;
                }

                syncSession(payload as AuthResponse);
            } catch {
                // Keep current session state when background sync fails.
            }
        };

        void syncSubscriptionPlan();
    }, [navigate]);

    useEffect(() => {
        const checkoutStatus = searchParams.get('checkout');
        const sessionId = searchParams.get('session_id');
        if (checkoutStatus !== 'success' || !sessionId) {
            return;
        }

        const token = localStorage.getItem('verilens_token');
        if (!token) {
            return;
        }

        const confirmCheckout = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/billing/confirm-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ session_id: sessionId }),
                });

                const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };

                if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
                    handleExpiredSession();
                    return;
                }

                if (!response.ok || !payload.access_token || !payload.user || !payload.token_type) {
                    toast.error(payload.detail ?? 'Could not confirm your payment.');
                    return;
                }

                syncSession(payload as AuthResponse);
                toast.success('Payment confirmed. Your plan has been updated.');
                setSearchParams({}, { replace: true });
            } catch {
                toast.error('Could not confirm your payment right now.');
            }
        };

        void confirmCheckout();
    }, [searchParams, setSearchParams]);

    const syncSession = (payload: AuthResponse) => {
        localStorage.setItem('verilens_token', payload.access_token);
        localStorage.setItem(
            'verilens_session',
            JSON.stringify({
                tokenType: payload.token_type,
                user: payload.user,
                loggedInAt: new Date().toISOString(),
            })
        );
        setUser(payload.user);
    };

    const handleExpiredSession = () => {
        localStorage.removeItem('verilens_token');
        localStorage.removeItem('verilens_session');
        toast.error('Session expired. Please log in again.');
        navigate('/login');
    };

    const closeCropModal = () => {
        if (selectedImage?.startsWith('blob:')) {
            URL.revokeObjectURL(selectedImage);
        }
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1.2);
        setCropAspect(1);
        setCroppedAreaPixels(null);
    };

    const uploadProfileImage = async (profileImage: string) => {
        const token = localStorage.getItem('verilens_token');
        if (!token) {
            toast.error('Please log in again.');
            navigate('/login');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profile_image: profileImage }),
        });

        const payload = (await response.json()) as Partial<AuthResponse> & { detail?: string };
        if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
            handleExpiredSession();
            return;
        }

        if (!response.ok || !payload.access_token || !payload.user || !payload.token_type) {
            toast.error(payload.detail ?? 'Could not update profile picture.');
            return;
        }

        syncSession(payload as AuthResponse);
        toast.success('Profile picture updated.');
    };

    const handleCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const confirmAndUploadCroppedImage = async () => {
        if (!selectedImage || !croppedAreaPixels) {
            toast.error('Please select a crop area first.');
            return;
        }

        try {
            setIsUpdatingPic(true);
            const croppedDataUrl = await getCroppedImageDataUrl(selectedImage, croppedAreaPixels);
            await uploadProfileImage(croppedDataUrl);
            closeCropModal();
        } catch {
            toast.error('Unable to crop and upload image right now.');
        } finally {
            setIsUpdatingPic(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('verilens_token');
        localStorage.removeItem('verilens_session');
        toast.success('Logged out successfully.');
        navigate('/');
    };

    const handleProfileFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file.');
            return;
        }

        const token = localStorage.getItem('verilens_token');
        if (!token) {
            toast.error('Please log in again.');
            navigate('/login');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedImage(objectUrl);
        if (event.target) {
            event.target.value = '';
        }
    };

    const deleteAccount = async () => {
        const token = localStorage.getItem('verilens_token');
        if (!token) {
            toast.error('Please log in again.');
            navigate('/login');
            return;
        }

        try {
            setIsDeleting(true);
            const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const payload = (await response.json()) as { detail?: string; message?: string };
            if (response.status === 401 || payload.detail === 'Invalid or expired token.') {
                handleExpiredSession();
                return;
            }

            if (!response.ok) {
                toast.error(payload.detail ?? 'Failed to delete account.');
                return;
            }

            localStorage.removeItem('verilens_token');
            localStorage.removeItem('verilens_session');
            toast.success(payload.message ?? 'Account deleted successfully.');
            navigate('/');
        } catch {
            toast.error('Unable to delete account right now.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                Loading profile...
            </main>
        );
    }

    const currentPlan = user?.subscription_plan ?? 'starter';
    const planLabel = currentPlan === 'pro' ? 'Pro' : currentPlan === 'ultra' ? 'Enterprise' : 'Starter';

    return (
        <main className={`min-h-screen relative overflow-hidden px-4 py-14 md:py-18 ${isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <SoftBackdrop />
            <div className='relative z-10 max-w-5xl mx-auto'>
                <div className='flex items-center justify-between mb-8'>
                    <Link to='/' aria-label='Go to homepage'>
                        <Brand />
                    </Link>
                    <Link to='/' className={`text-sm font-medium transition ${isDark ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                        Back to Home
                    </Link>
                </div>

                <section className={`relative rounded-3xl border backdrop-blur-md p-6 md:p-10 overflow-hidden ${
                    isDark
                        ? 'border-cyan-500/20 bg-linear-to-b from-cyan-900/20 via-slate-950/70 to-slate-950/85'
                        : 'border-cyan-300/50 bg-linear-to-b from-cyan-100/80 via-white/80 to-slate-100/90 shadow-2xl shadow-cyan-900/10'
                }`}>
                    <div className={`absolute -top-24 -right-24 size-64 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-cyan-500/15' : 'bg-cyan-300/50'}`} />
                    <div className={`absolute -bottom-20 -left-20 size-56 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-sky-500/10' : 'bg-sky-300/40'}`} />

                    <div className='relative flex flex-col gap-8'>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                            <div>
                                <h1 className='text-3xl md:text-4xl font-semibold tracking-tight'>Profile</h1>
                                <p className={`text-sm md:text-base mt-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Manage your account settings and security actions.</p>
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 border text-xs md:text-sm w-fit ${
                                isDark
                                    ? 'bg-cyan-600/15 border-cyan-400/30 text-cyan-200'
                                    : 'bg-cyan-100 border-cyan-300 text-cyan-700'
                            }`}>
                                Account Active
                            </div>
                        </div>

                        <div className='grid md:grid-cols-[1.4fr_1fr] gap-5'>
                            <div className={`rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-white/80'}`}>
                                <p className='text-xs uppercase tracking-wide text-cyan-300 mb-4'>Account Details</p>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-5'>
                                    {user?.profile_image ? (
                                        <img src={user.profile_image} alt='profile' className={`size-24 rounded-2xl object-cover border shadow-xl ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                                    ) : (
                                        <div className={`size-24 rounded-2xl border flex items-center justify-center text-3xl font-semibold shadow-xl ${
                                            isDark
                                                ? 'border-cyan-400/40 bg-cyan-700/20 text-cyan-200'
                                                : 'border-cyan-300 bg-cyan-100 text-cyan-700'
                                        }`}>
                                            {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                    )}

                                    <div>
                                        <p className='text-2xl font-semibold'>{user?.full_name}</p>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{user?.email}</p>
                                        <div className='mt-3'>
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                                                currentPlan === 'starter'
                                                    ? isDark
                                                        ? 'border-gray-500/40 bg-gray-500/10 text-gray-200'
                                                        : 'border-slate-300 bg-slate-100 text-slate-700'
                                                    : isDark
                                                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                                                        : 'border-emerald-300 bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {planLabel} Plan
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Use this section to keep your account identity and access up to date.</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-white/80'}`}>
                                <p className='text-xs uppercase tracking-wide text-cyan-300 mb-4'>Quick Info</p>
                                <div className={`space-y-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <span>Account Status</span>
                                        <span className='text-emerald-300'>Active</span>
                                    </div>
                                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <span>Email</span>
                                        <span className='text-cyan-300'>Verified</span>
                                    </div>
                                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <span>Support</span>
                                        <span className='text-sky-300'>24/7</span>
                                    </div>
                                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <span>Subscription</span>
                                        <span className={`${
                                            currentPlan === 'starter'
                                                ? isDark
                                                    ? 'text-gray-300'
                                                    : 'text-slate-700'
                                                : 'text-emerald-300'
                                        }`}>{planLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-white/80'}`}>
                            <p className='text-xs uppercase tracking-wide text-cyan-300 mb-4'>Account Actions</p>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Update your profile picture, sign out safely, or delete your account.</p>
                            <div className='flex flex-wrap gap-3'>
                                <PrimaryButton
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUpdatingPic}
                                    className='px-6 py-3 disabled:opacity-60'
                                >
                                    <CameraIcon className='size-4' />
                                    {isUpdatingPic ? 'Updating...' : 'Update Profile Picture'}
                                </PrimaryButton>

                                <GhostButton onClick={logout} className='px-6 py-3'>
                                    Logout
                                </GhostButton>

                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isDeleting}
                                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border transition disabled:opacity-60 ${
                                        isDark
                                            ? 'border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200'
                                            : 'border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-700'
                                    }`}
                                >
                                    <Trash2Icon className='size-4' />
                                    {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleProfileFileSelect}
                />

                {selectedImage && (
                    <div className='fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4'>
                        <div className={`w-full max-w-2xl rounded-2xl border p-5 md:p-6 ${isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className='text-lg font-semibold'>Crop Profile Picture</h2>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                Drag to reposition, use zoom, and choose your preferred crop shape.
                            </p>

                            <div className='relative mt-4 h-72 md:h-80 rounded-xl overflow-hidden border border-white/10 bg-black/40'>
                                <Cropper
                                    image={selectedImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={cropAspect}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={handleCropComplete}
                                />
                            </div>

                            <div className='mt-4 space-y-4'>
                                <div>
                                    <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Zoom</label>
                                    <input
                                        type='range'
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(event) => setZoom(Number(event.target.value))}
                                        className='w-full mt-2'
                                    />
                                </div>

                                <div className='flex flex-wrap items-center gap-2'>
                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Crop shape:</span>
                                    <button
                                        type='button'
                                        onClick={() => setCropAspect(1)}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${cropAspect === 1
                                            ? 'border-cyan-400 text-cyan-300'
                                            : isDark
                                                ? 'border-white/10 text-gray-300'
                                                : 'border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        Square
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setCropAspect(4 / 5)}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${cropAspect === 4 / 5
                                            ? 'border-cyan-400 text-cyan-300'
                                            : isDark
                                                ? 'border-white/10 text-gray-300'
                                                : 'border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        Portrait
                                    </button>
                                </div>
                            </div>

                            <div className='mt-5 flex flex-wrap gap-3 justify-end'>
                                <GhostButton onClick={closeCropModal} className='px-5 py-2.5'>Cancel</GhostButton>
                                <PrimaryButton onClick={confirmAndUploadCroppedImage} disabled={isUpdatingPic} className='px-5 py-2.5 disabled:opacity-60'>
                                    {isUpdatingPic ? 'Uploading...' : 'Crop & Upload'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className='fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4'>
                        <div className={`w-full max-w-md rounded-2xl border p-5 md:p-6 ${isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className='text-lg font-semibold'>Delete account?</h2>
                            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                Are you sure you want to delete your account? This action cannot be undone.
                            </p>

                            <div className='mt-5 flex justify-end gap-3'>
                                <GhostButton
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className='px-5 py-2.5'
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </GhostButton>

                                <button
                                    onClick={deleteAccount}
                                    disabled={isDeleting}
                                    className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium border transition disabled:opacity-60 ${
                                        isDark
                                            ? 'border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200'
                                            : 'border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-700'
                                    }`}
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, delete account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
