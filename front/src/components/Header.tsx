import { APP_NAME } from "../costants";
import { useTheme } from "./themeProvider/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-ghost gap-2"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
          Light
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            />
          </svg>
          Dark
        </>
      )}
    </button>
  );
}

function Header() {
  return (
    <header className="border-b border-base-300 bg-base-100">
      <div className="navbar mx-auto max-w-6xl px-4">
        <div className="flex-1 text-2xl font-semibold">{APP_NAME}</div>
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
