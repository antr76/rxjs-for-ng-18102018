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

const inputElement = document.querySelector('#input') as Element;
const input$ = fromEvent(inputElement, 'input');

searchGithubRepos(input$).subscribe(renderData);

function searchGithubRepos(input$: Observable<Event>): Observable<GithubRepository[]> {
    return input$.pipe(
        pluck<Event, string>('target', 'value'),
        filter(isNotEmpty),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(loadFromGithub),
        tap(console.log)
    );
}

function renderData(githubRepos: GithubRepository[]): void {
    const parentElement = document.querySelector('#output') as Element;
    // Remove all child elements from that element
    // After that happened new children will be added.
    parentElement.innerHTML = '';
    githubRepos.forEach(
        githubRepo => renderRepoInfo(parentElement, githubRepo)
    );
}

function renderRepoInfo(parentElement: Element, repo: GithubRepository): void {
    const wrapperElement = document.createElement('div') as Element;
    parentElement.append(wrapperElement);
    wrapperElement.className = 'repo-wrapper';
    const wrapperElementContent = `
        <p class="info">${repo.name}</p>
        <p class="url">
            <a href="${repo.url}" target="_blank">${repo.url}</a>
        </p>
        <p class="description">${repo.description}</p>
    `;
    wrapperElement.innerHTML = wrapperElementContent;
}

function isNotEmpty(value: string) {
    return value.length > 0;
}

function mapToGithubRepository(items: GithubRepositoryInfo[]): GithubRepository[] {
    return items.map(item => new GithubRepository(item));
}

function loadFromGithub(search: string): Observable<GithubRepository[]> {
    const url = `https://api.github.com/search/repositories?q=${search}&order=desc&sort=stars`;

    return fetchData(url)
        .pipe(
            pluck<{}, GithubRepositoryInfo[]>('items'),
            //tap(data => console.log('before map', data)),
            map(mapToGithubRepository),
            //tap(data => console.log('after map', data)),
        );
}

function fetchData(url: string): Observable<GithubRepositoryInfo> {
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
    public stars: number;

    constructor(data: GithubRepositoryInfo) {
        this.name = data['name'];
        this.homepage = data['homepage'];
        this.description = data['description'];
        this.url = data['html_url'];
        this.forks = data['forks'];
        this.stars = data['stargazers_count'];
    }
}

// Type which describes the original data structure of the github repository
type GithubRepositoryInfo = {
    name: string
    homepage: string
    description: string
    html_url: string
    forks: number
    stargazers_count: number
}
