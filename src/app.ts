import {
    from,
    fromEvent,
    Observable
} from 'rxjs';
import {
    tap,
    pluck,
    switchMap,
    map,
    distinctUntilChanged,
    debounceTime
} from 'rxjs/operators';

// Import styles fot the whole app.
// Do not do it in the index.html it will not work!
import './styles.css';

const input: Element | null = document.querySelector('#input');

const input$ = fromEvent(input as Element, 'input');

const githubRepos$: Observable<GithubRepository[]> = input$
    .pipe(
        map(mapEventToValue),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(searchString => loadFromGithub(searchString)),
        tap(console.log)
    );

githubRepos$.subscribe(
    (githubRepos: GithubRepository[]) => showData(githubRepos)
);

function showData(githubRepos: GithubRepository[]) {
    const parentElement: Element | null = document.querySelector('#output');
    // Remove all child elements from that element
    (parentElement as Element).innerHTML = '';
    githubRepos.forEach((githubRepo: GithubRepository) => {
        showRepo(parentElement as Element, githubRepo);
    });
}

function showRepo(parentElement: Element, repo: GithubRepository) {
    const divElement: HTMLDivElement = document.createElement('div');
    divElement.className = 'repo-wrapper';
    // info element
    const infoElement = document.createElement('p');
    infoElement.className = 'info';
    infoElement.innerHTML = repo.name;
    divElement.appendChild(infoElement);
    // url element
    const urlElement = document.createElement('p');
    const ancorElement = document.createElement('a');
    const url = repo.url;
    ancorElement.setAttribute("href", url);
    ancorElement.setAttribute("target", '_blank');
    ancorElement.innerHTML = url;
    urlElement.appendChild(ancorElement);
    urlElement.className = 'url';
    divElement.appendChild(urlElement);
    // description element
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'description';
    descriptionElement.innerHTML = repo.description;
    divElement.appendChild(descriptionElement);
    parentElement.append(divElement);
}

function mapEventToValue(event: Event) {
    return (event.target! as any).value;
}

function mapToGithubRepository(items: any): GithubRepository[] {
    return items.map((item: any) => new GithubRepository(item));
}

function loadFromGithub(searchString: any): Observable<GithubRepository[]> {
    const url = `https://api.github.com/search/repositories?q=${searchString}&order=desc&sort=stars`;

    return fetchData(url)
        .pipe(
            pluck('items'),
            //tap(data => console.log('before map', data)),
            map(mapToGithubRepository),
            //tap(data => console.log('after map', data)),
        );
}

function fetchData(url: string) {
    return from(
        fetch(url)
            .then(
                response => response.json()
            )
    );
}

class GithubRepository {
    public name: string;
    public homepage: string;
    public description: string;
    public url: string;
    public forks: number;
    public stars: string;

    constructor(data: any) {
        this.name = data['name'];
        this.homepage = data['homepage'];
        this.description = data['description'];
        this.url = data['html_url'];
        this.forks = data['forks'];
        this.stars = data['stargazers_count'];
    }

}
