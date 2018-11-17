import {
    fromEvent,
    Observable,
    Observer,
    of,
} from 'rxjs';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    pluck,
    switchMap,
    tap,
} from 'rxjs/operators';

// Import styles fot the whole app.
// Do not do it in the index.html it will not work!
import './styles.css';

const inputElement: Element = document.querySelector('#input') as Element;
const input$: Observable<Event> = fromEvent(inputElement, 'input');

searchGithubRepos(input$).subscribe(
    (githubRepos: GithubRepository[]) => {
        console.log('Emitted new value', githubRepos);
        renderData(githubRepos);
    },
    (err: Error) => console.error('Error occurred while retrieving github repositories: ', err),
    () => console.log('Stream completed')
);

function searchGithubRepos(inputObs$: Observable<Event>): Observable<GithubRepository[]> {
    return inputObs$.pipe(
        pluck<Event, string>('target', 'value'),
        filter(isNotEmpty),
        debounceTime(800),
        distinctUntilChanged(),
        tap((searchString: string) => console.log('searching for github repositories: ', searchString)),
        switchMap(loadFromGithub),
        // tap(data => console.log('returned from loadFromGithub method', data))
    );
}

function renderData(githubRepos: GithubRepository[]): void {
    const parentElement: Element = document.querySelector('#output') as Element;
    // Remove all child elements from that element
    // After that happened new children will be added.
    parentElement.innerHTML = '';
    githubRepos.forEach(
        (githubRepo: GithubRepository) => renderRepoInfo(parentElement, githubRepo)
    );
}

function renderRepoInfo(parentElement: Element, repo: GithubRepository): void {
    const wrapperElement: Element = document.createElement('div') as Element;
    parentElement.append(wrapperElement);
    wrapperElement.className = 'repo-wrapper';
    const wrapperElementContent: string = `
        <p class="info">${repo.name}</p>
        <p class="url">
            <a href="${repo.url}" target="_blank">${repo.url}</a>
        </p>
        <p class="description">${repo.description}</p>
    `;
    wrapperElement.innerHTML = wrapperElementContent;
}

function isNotEmpty(value: string): boolean {
    return value.length > 0;
}

function mapToGithubRepository(items: GithubRepositoryInfo[]): GithubRepository[] {
    return items.map((item: GithubRepositoryInfo) => new GithubRepository(item));
}

function loadFromGithub(search: string): Observable<GithubRepository[]> {
    const url: string = `https://api.github.com/search/repositories?q=${search}&order=desc&sort=stars`;

    const hithubRepos$: Observable<GithubRepository[]> = fetchData(url)
        .pipe(
            // tap(() => console.log('fetchData start')),
            pluck<{}, GithubRepositoryInfo[]>('items'),
            // tap(data => console.log('before map', data)),
            map(mapToGithubRepository),
            catchError((_err: Error) => of([])),
            // tap(data => console.log('return value', data)),
        );

        return hithubRepos$;
}

function fetchData<T>(url: string): Observable<T> {

    return Observable.create((observer: Observer<T>) => {
        fetch(url)
            .then((response: Response) => response.json())
            .then((data: T) => {
                observer.next(data);
                observer.complete();
            })
            .catch((err: Error) => observer.error(err));

            return function onUnsubscribe(): void {
                console.log('Stream unsubscribed');
            };
    });

}

class GithubRepository {
    public name: string;
    public homepage: string;
    public description: string;
    public url: string;
    public forks: number;
    public stars: number;

    public constructor(data: GithubRepositoryInfo) {
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
};
