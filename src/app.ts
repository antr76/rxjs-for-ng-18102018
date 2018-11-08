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
    filter,
    distinctUntilChanged,
    debounceTime
} from 'rxjs/operators';

// Import styles fot the whole app.
// Do not do it in the index.html it will not work!
import './styles.css';

const inputElement = <Element>document.querySelector('#input');

const input$ = fromEvent(inputElement, 'input');

const githubRepos$: Observable<GithubRepository[]> = input$
    .pipe(
        map(mapEventToValue),
        filter(isNotEmpty),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(search => loadFromGithub(search)),
        tap(console.log)
    );

githubRepos$.subscribe(
    (githubRepos: GithubRepository[]) => renderData(githubRepos)
);

function renderData(githubRepos: GithubRepository[]): void {
    const parentElement = <Element>document.querySelector('#output');
    // Remove all child elements from that element
    // After that happened new children will be added.
    parentElement.innerHTML = '';
    githubRepos.forEach((githubRepo: GithubRepository) => {
        renderRepoInfo(parentElement as Element, githubRepo);
    });
}

function renderRepoInfo(parentElement: Element, repo: GithubRepository) {
    const divElement = document.createElement('div');
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

function isNotEmpty(value: string) {
    return value.length > 0;
}

function mapEventToValue(event: any): string {
    return event.target.value;
}

function mapToGithubRepository(items: any): GithubRepository[] {
    return items.map((item: any) => new GithubRepository(item));
}

function loadFromGithub(search: string): Observable<GithubRepository[]> {
    const url = `https://api.github.com/search/repositories?q=${search}&order=desc&sort=stars`;

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
        fetch(url).then(response => response.json())
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
