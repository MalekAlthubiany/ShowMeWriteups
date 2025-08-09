export const metadata = {
  title: 'BugDaily',
  description: 'Daily public write‑ups of critical bounty reports',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial', background:'#f8fafc', color:'#0f172a', margin:0}}>
        {children}
      </body>
    </html>
  );
}
