export default function MobileShell({ children }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-6 md:flex md:items-center md:justify-center md:px-8">
      <div className="w-full md:w-[393px] md:max-h-[852px] md:overflow-hidden md:rounded-[50px] md:border-2 md:border-navy md:bg-white">
        <div className="h-full">{children}</div>
      </div>
    </div>
  );
}
