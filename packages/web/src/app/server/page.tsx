import { baseAPIUrl } from "@/utils";

const getData = async () => {
  // try {
  //   const response = await fetch(`${baseAPIUrl}/api/health`, {
  //     // method: "GET",
  //     cache: "no-store"
  //     // headers: {
  //     //   "Content-Type": "application/json"
  //     // }
  //   });
  //   const data = await response.json();
  //   return data;
  // } catch (error) {
  //   return "FUCK YOU NEXT";
  // }

  return fetch(`${baseAPIUrl}/api/health`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((res) => res)
    .catch((error) => {
      // Handle any errors that occurred during fetch or JSON parsing
      console.error("Fetch error:", error);
      return null;
    });
};

export default async function Server() {
  const data = await getData();
  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      <div className="mx-auto">
        <figure className="mt-10">
          <blockquote className="text-center text-xl font-semibold leading-8 text-slate-900 sm:text-2xl sm:leading-9 prose-code">
            <p>{JSON.stringify(data)}</p>
          </blockquote>
          <figcaption className="mt-10">
            <div className="mt-4 flex items-center justify-center space-x-3 text-base">
              <div className="font-semibold text-slate-900">Plutomi API</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
