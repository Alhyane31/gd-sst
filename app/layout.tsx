import SessionProviderWrapper from "./providers/SessionProviderWrapper";
import ThemeRegistry from "./theme-registry";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <SessionProviderWrapper>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
