document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("news-grid");
    const loading = document.getElementById("loading");
    const filterContainer = document.getElementById("category-filters");
    const searchInput = document.getElementById("search-input");

    let allArticles = [];
    let currentCategory = "All";

    // Fetch configuration sources
    fetch('data/sources.json')
        .then(res => res.json())
        .then(data => {
            setupFilters(data.categories);
            fetchAllFeeds(data.feeds);
        })
        .catch(err => {
            loading.innerHTML = `<p class="text-red-400">Failed to load configuration sources.</p>`;
            console.error(err);
        });

    function setupFilters(categories) {
        filterContainer.innerHTML = "";
        categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat;
            btn.className = `px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                cat === "All" 
                    ? "bg-emerald-600 border-emerald-500 text-white" 
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
            }`;
            btn.addEventListener("click", () => {
                currentCategory = cat;
                document.querySelectorAll("#category-filters button").forEach(b => {
                    b.className = "px-3 py-1.5 text-xs font-medium rounded-lg border bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800";
                });
                btn.className = "px-3 py-1.5 text-xs font-medium rounded-lg border bg-emerald-600 border-emerald-500 text-white";
                renderArticles();
            });
            filterContainer.appendChild(btn);
        });
    }

    async function fetchAllFeeds(feeds) {
        let promises = feeds.map(feedSource => {
            // Using allorigins proxy to bypass CORS restrictions on client-side JS
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedSource.url)}`;
            return fetch(proxyUrl)
                .then(res => res.text())
                .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
                .then(data => {
                    const items = data.querySelectorAll("item");
                    let parsedItems = [];
                    items.forEach((item, index) => {
                        if(index < 10) { // Grab top 10 from each source
                            parsedItems.push({
                                title: item.querySelector("title")?.textContent || "No Title",
                                link: item.querySelector("link")?.textContent || "#",
                                pubDate: new Date(item.querySelector("pubDate")?.textContent || Date.now()),
                                description: cleanText(item.querySelector("description")?.textContent || ""),
                                category: feedSource.category,
                                source: feedSource.name
                            });
                        }
                    });
                    return parsedItems;
                })
                .catch(err => {
                    console.error(`Error fetching feed: ${feedSource.name}`, err);
                    return [];
                });
        });

        let results = await Promise.all(promises);
        allArticles = results.flat().sort((a, b) => b.pubDate - a.pubDate);
        
        loading.style.display = "none";
        renderArticles();
    }

    function cleanText(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        let text = doc.body.textContent || "";
        return text.length > 150 ? text.substring(0, 150) + "..." : text;
    }

    function renderArticles() {
        const query = searchInput.value.toLowerCase();
        grid.innerHTML = "";

        let filtered = allArticles.filter(art => {
            let matchesCategory = currentCategory === "All" || art.category === currentCategory;
            let matchesSearch = art.title.toLowerCase().includes(query) || art.description.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });

        if(filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-12">No updates found matching criteria.</div>`;
            return;
        }

        filtered.forEach(art => {
            const card = document.createElement("div");
            card.className = "bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all";
            
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-center gap-2 mb-3">
                        <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">${art.category}</span>
                        <span class="text-xs text-slate-500">${art.pubDate.toLocaleDateString()}</span>
                    </div>
                    <a href="${art.link}" target="_blank" rel="noopener noreferrer" class="font-semibold text-slate-100 hover:text-emerald-400 transition-colors line-clamp-2 mb-2 text-sm">
                        ${art.title}
                    </a>
                    <p class="text-xs text-slate-400 line-clamp-3 mb-4">
                        ${art.description}
                    </p>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                    <span class="truncate max-w-[180px]">${art.source}</span>
                    <a href="${art.link}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline flex items-center gap-1 font-medium">
                        Read Source &rarr;
                    </a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    searchInput.addEventListener("input", renderArticles);
});
