import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <LoginForm />
      {/* Registration removed - only admin can create users */}
    </div>
  );
}
