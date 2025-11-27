import Header from "./Header";
import JourneyMap from "./JourneyMap";

function Base() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="card w-full bg-base-100 shadow-sm h-[80vh]">
          <div className="card-body gap-6">
            <JourneyMap />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Base;
