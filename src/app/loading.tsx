const LETTERS = "utopians core".split("");

export default function Loading() {
  return (
    <div role="status" aria-label="Loading your page" className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
      <div className="preloader-word !text-2xl sm:!text-3xl" aria-hidden="true">
        {LETTERS.map((char, i) =>
          char === " " ? (
            <span key={i} className="preloader-space" />
          ) : (
            <span key={i} className={`preloader-letter ${i > 8 ? "text-indigo-600 font-[450]" : ""}`}>
              <span style={{ "--i": i } as React.CSSProperties}>{char}</span>
            </span>
          ),
        )}
      </div>
      <div className="preloader-bar">
        <span className="preloader-bar-fill" />
      </div>
    </div>
  );
}
