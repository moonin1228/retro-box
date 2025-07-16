function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
    </div>
  );
}

export default PageLoader;
