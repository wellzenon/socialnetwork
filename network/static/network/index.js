function Heart(props){
    const solid ="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"
    const outline= "M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z"
    
    let d = props.fill==="solid" ? solid : outline

    return(
        <svg 
            width={props.size}
            heigth={props.size}
            aria-hidden="true" 
            focusable="false" 
            data-prefix="far" 
            data-icon="heart" 
            className="heart" 
            role="img" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512">
            <path 
                className= {`heart-path ${props.className}`}
                fill={props.color} 
                d={d}>
            </path>
            <filter id="blur" >
                <feGaussianBlur stdDeviation="0.5" />
            </filter> 
        </svg>
    );
};

function Button (props){
    //General button class
    return(
        <button className = {`btn ${props.className}`} value={props.value} onClick={props.onclick}>
            {props.value}
        </button>
    )
};

class Profile extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            profile: '',
            following: [],
            followers: [],
            posts: [],
            page: 1,
            page_total: 1,
            isFollowed: false,
        };
    };
    
    toggleFollow = () => {
        fetch(`/user/${this.props.profile.id}/follow`, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken()},
            body: JSON.stringify({
                profile: this.props.profile
            })
        })
        .then(response => response.json())
        .then(result => {
            this.getPosts(this.state.page);
            console.log(result);            
        });
    };

    getPosts = (page) => {
        fetch(`/user/${this.props.profile.id}?page=${page}`)
            .then((response) => response.json())
            .then((json) => {                
                this.setState({
                    profile: json.profile,
                    following: json.following,
                    followers: json.followers,
                    posts: json.posts,
                    page_total: json.page_total,
                    page: page,
                    isFollowed:json.followers.find( profile => profile.id === this.props.user.id),
                });
            })
            .catch((error) => {
                console.error(error);
            });
    };

    componentDidMount(){
        this.getPosts(1);
    };

    render(){
        return(
            <React.Fragment>
                <div className = "profile d-flex flex-column justify-content-center p-3 mb-3 rounded">
                    <h1 className = "profile-name display-5 text-center "><strong>{this.state.profile.user}</strong></h1>
                    <p className = "profile-following text-center text-muted">Following {this.state.following.length} | Followed by {this.state.followers.length}</p>
                    {this.props.user.id !== this.props.profile.id 
                        && <Button 
                            className = {`follow-button ${this.state.isFollowed ? "btn-outline-info" : "btn-success"}`}
                            value={`${this.state.isFollowed ? 'Unfollow' : 'Follow'}`} 
                            onclick={this.toggleFollow} 
                        />
                    }
                </div>
                <PostList 
                    user={this.props.user}
                    posts={this.state.posts}
                    getposts={this.getPosts}
                    page_total={this.state.page_total}
                    gotoprofile={this.props.gotoprofile}
                />
            </React.Fragment>
        )
    };
};

function csrftoken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class PostForm extends React.Component {
    constructor(props){
        super(props);
        this.state ={
            text: this.props.id ? this.props.text : '' ,
            message: ""
        };
    };

    handleChange = event => this.setState({text: event.target.value});

    handleSubmit = event => {
        this.props.id ? this.edit() : this.newpost();
        event.preventDefault();
    };

    newpost = () => {
        fetch('/post', {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken()},
            body: JSON.stringify({
                text: this.state.text
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.message){
                this.setState({
                    message: result.message,
                })
            }else{
                this.setState({text: ''});
                this.props.getposts();
            }
            console.log(result);            
        });
    };

    edit = () => {
        fetch(`/post/${this.props.id}/edit`, {
            headers: {'X-CSRFToken': csrftoken()},
            method: 'PUT',
            body: JSON.stringify({
                text: this.state.text
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.message){
                this.setState({
                    message: result.message,
                })
            }else{
                this.setState({text: ''});
                this.props.getposts();
            }
            console.log(result);            
        });
    };

    render(){
        return(
            <React.Fragment>
                {this.state.message && <Message message={this.state.message} />}
                <form className = "form-group container-sm" onSubmit={this.handleSubmit}>
                    <textarea className = "form-control" id="new-post-text" onChange={this.handleChange} placeholder="Write post here" value={this.state.text}></textarea>
                    <input className = "btn btn-primary" id="new-post-btn" type="submit" value="post" /> 
                </form>
            </React.Fragment>
        );
    }
    
};

class Post extends React.Component {
    constructor(props){
        super(props);
        this.state={
            user:"",
            text:"",
            likes:"",                
            liked:"", 
            timestamp:"",
            edit:false,
        };
    };

    getpost = () => {
        fetch(`/post/${this.props.id}`)
        .then( r => r.json())
        .then(json => {
            this.setState({
                user:json.user,
                text:json.text,
                likes:json.likes,                
                liked:json.liked, 
                timestamp:json.timestamp,
            });
        });
    }

    componentDidMount() {
        this.getpost();
    };

    goToProfile = () => {
        this.props.gotoprofile(this.state.user.id);
    };

    edit = () => {this.setState({edit: true})};

    refresh = () => {
        this.getpost();
        this.setState({edit: false});
    }

    toggle_like = () => {
        fetch(`/post/${this.props.id}/like`, {
            headers: {'X-CSRFToken': csrftoken()},
            method: 'PUT',
            body: JSON.stringify({
                liked: this.state.liked
            })
        })
        .then(response => response.json())
        .then(result => {
            this.getpost();
            console.log(result);            
        });
        
    };

    render(){

        let likeButton;
        if (this.state.liked){
            likeButton = <Heart fill="solid" size="16" color="red" />
        } else {
            likeButton = <Heart fill="outline" size="16" color="red" />
        }

        return(
            <li className = "post-item bg-light p-3 mb-3 rounded">
                <p className ="post-head">
                    <a onClick={this.goToProfile} >{this.state.user.name}</a>
                    <span className = "small text-muted">
                        {this.props.user && this.props.user.id === this.state.user.id && <Button className = "badge badge-secondary mx-2" value="edit" onclick={this.edit} />}
                        {this.state.timestamp}
                    </span>
                </p>
                {this.state.edit && 
                    <PostForm 
                        id={this.props.id} 
                        text={this.state.text}
                        getposts = {this.refresh}
                    />}
                {!this.state.edit && 
                    <p className ="post-body">
                        {this.state.text}
                    </p>}
                <p className ="post-foot small text-muted m-0">
                    <Button className = "like-button py-0 px-1" value={likeButton} onclick={this.toggle_like} />
                    <span className="px-2" >{`${this.state.likes} like${this.state.likes == 1 ? "" : "s"}`}</span>
                </p>
            </li>
        );
    }
};

class Paginator extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            page: 1,
        };
    };

    getPosts = page => {
        if (1 <= page <= this.props.page_total){
            this.props.getposts(page);
            this.setState({page: page});
        }
    };

    firstPage = () => {this.getPosts(1)};
    previousPage = () => {this.getPosts(this.state.page -1)};
    nextPage = () => {this.getPosts(this.state.page +1)};
    lastPage = () => {this.getPosts(this.props.page_total)};

    render(){
        return(
            this.props.page_total > 1 &&
                <div className="d-flex justify-content-center p-3">
                    <div className="btn-group align-items-baseline border border-secondary rounded">
                        {this.state.page > 2 && 
                            <Button
                                className = "btn-outline-secondary" 
                                value="First page" 
                                onclick={this.firstPage} /> }
                        {this.state.page > 1 && 
                            <Button 
                                className = "btn-outline-secondary"
                                value="Previous page" 
                                onclick={this.previousPage} />}
                        <span className="px-2"> Page {this.state.page} of {this.props.page_total} </span>
                        {this.state.page < this.props.page_total  && 
                            <Button 
                                className = "btn-outline-secondary"    
                                value="Next page" 
                                onclick={this.nextPage} />}
                        {this.state.page < this.props.page_total + 1  &&
                            <Button 
                                className = "btn-outline-secondary"
                                value="Last page" 
                                onclick={this.lastPage} />}
                    </div>
                </div>
        );
    };
};

function PostList(props) {
    const posts = props.posts.slice();
    const postslist = posts.map((post) => {
        return (<Post 
            user={props.user}
            key={post}
            id={post}
            gotoprofile={props.gotoprofile}
        />);
    });
    return (
        <React.Fragment>
            <ul className = {`list-unstyled container ${props.className} `}> 
                {postslist}
            </ul>
            <Paginator 
                getposts = {props.getposts}
                page_total={props.page_total}
            />
        </React.Fragment>
    );
};

class Following extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            posts: [],
            page: 1,
            page_total:1,
        };
    };

    getPosts = (page) => {
        fetch(`/following?page=${page}`)
            .then((response) => response.json())
            .then((json) => {
                this.setState({
                    posts: json.posts,
                    page: page,
                    page_total: json.page_total,
                });
                console.log(json);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    componentDidMount() {
        this.getPosts(1);
    };

    render() {
        return (
            <PostList 
                user = {this.props.user}
                posts = {this.state.posts} 
                getposts = {this.getPosts}
                gotoprofile = {this.props.gotoprofile}
                page_total = {this.state.page_total}
            />
        );
    };
};

class AllPosts extends React.Component {
   
    constructor(props){
        super(props);
        this.state = {
            posts: [],
            page:1,
            page_total: 1,
            text: '',
        };
    };

    getPosts = (page) => {
        fetch(`/all-posts?page=${page}`)
            .then((response) => response.json())
            .then((json) => {
                this.setState({
                    posts: json.posts,
                    page: page,
                    page_total: json.page_total,
                });
                console.log(json);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    componentDidMount() {
        this.getPosts(1);
    };

    render() {
        return (
            <React.Fragment>
            {this.props.user && 
                <PostForm  
                    text={this.state.text}
                    getposts = {() => this.getPosts(this.state.page)}
                />
            }
            <PostList 
                user = {this.props.user}
                posts = {this.state.posts} 
                getposts = {this.getPosts}
                gotoprofile = {this.props.gotoprofile}
                page_total = {this.state.page_total}
            />
            </React.Fragment>
        );
    };
};

class LogIn extends React.Component {
    constructor(props){
        super(props);
        this.state={
            username:'',
            password:'',
            message:'',
        }
    };

    handleSubmit = event => {
        fetch('/login', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken(),
                'Content-Type': 'application/json',
            },
            mode: 'same-origin',  
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
            })
        })
        .then(response => response.json())
        .then(result => {
            result.user ? this.props.login(result) : this.setState({message: result.message});
            console.log(result);            
        });
        event.preventDefault();
        
    };

    handleUsername = (event) => this.setState({username: event.target.value});
    handlePassword = (event) => this.setState({password: event.target.value});

    render(){
        return(
            <React.Fragment>
                {this.state.message && <Message message={this.state.message} />}
                <form className = "form-group container-sm" onSubmit={this.handleSubmit}>
                    <input className = "form-control" type="text" name="username" placeholder="Username" onChange={this.handleUsername} autoFocus />
                    <input className = "form-control" type="password" name="password" placeholder="Password" onChange={this.handlePassword} />
                    <input className = "btn btn-primary"type="submit" value="Log in" />
                </form>
            </React.Fragment>
        );
    };
}

function logOut(loginfunction) {
    fetch('/logout')
    .then(response => response.json())
    .then(result => {
        loginfunction();
        console.log(result);            
    });
}

class Register extends React.Component {
    constructor(props){
        super(props);
        this.state={
            username:'',
            email:'',
            password:'',
            confirmation:'',
            message:''
        }
    };

    handleUsername = (event) => this.setState({username: event.target.value});
    handleEmail = (event) => this.setState({email: event.target.value});
    handlePassword = (event) => this.setState({password: event.target.value});
    handleConfirmation = (event) => this.setState({confirmation: event.target.value});

    handleSubmit = event => {
        
        fetch('/register', {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken()},
            body: JSON.stringify({
                username: this.state.username,
                email: this.state.email,
                password: this.state.password,
                confirmation: this.state.confirmation,
            })
        })
        .then(response => response.json())
        .then(result => {
            result.user ? this.props.login(result) : this.setState({message: result.message});
            console.log(result);            
        });
        event.preventDefault();
    };

    render(){
        return(
            <React.Fragment>
                {this.state.message && <Message message={this.state.message} />}
                <form className = "form-group container-sm" onSubmit={this.handleSubmit}>
                    <input className = "form-control" type="text" name="username" placeholder="Username" onChange={this.handleUsername} autoFocus />
                    <input className = "form-control" type="email" name="email" placeholder="Email Address" onChange={this.handleEmail} />
                    <input className = "form-control" type="password" name="password" placeholder="Password" onChange={this.handlePassword} />
                    <input className = "form-control" type="password" name="confirmation" placeholder="Confirm Password" onChange={this.handleConfirmation} />
                    <input className = "btn btn-primary" type="submit" value="Register" />
                </form>
            </React.Fragment>
        );
    };
}

function Message(props){
    return(
        <div className = "alert alert-danger">{props.message}</div>
    )
};

class Page extends React.Component {
    constructor (props){
        super(props);
        this.profileElement = React.createRef();
        this.state={
            page: 'allposts',
            user: null,
            profile: null,
            message:""
        };
    };

    logIn = user => {this.setState({user: user, page: 'allposts'})};
    goToRegister = () => this.setState({page:'register'});
    goToLogIn = () => this.setState({page:'login', user: null, profile: null});
    goToLogOut = () => {logOut(this.goToLogIn)};
    goToAllPosts = () => this.setState({page:'allposts'});
    goToFollowing = () => this.setState({page:'following'});

    goToProfile = (id) => {
        fetch(`/user/${id}`)
            .then((response) => response.json())
            .then((json) => {                
                this.setState({
                    page:'profile',
                    profile: json.profile,
                })
                this.profileElement.current.getPosts(1)
            })
            .catch((error) => {
                console.error(error);
            });
    };

    componentDidMount() {
        fetch("/menu")
            .then((response) => response.json())
            .then((json) => {   
                !json.message && this.setState({
                    user: json,
                    profile: json});             
            })
            .catch((error) => {
                console.error(error);
            });
    };

    render(){
        let logged = this.state.user
        return(
            <React.Fragment>
                <div className="d-flex justify-content-center text-center mt-3">
                    <div className="d-inline-flex flex-wrap justify-content-center bg-secondary rounded-pill p-3 px-5">
                        <h1 className="display-5 font-weight-bold text-center text-white">
                            SOCIAL                 
                        </h1>
                        <h1 className="display-5 font-italic text-center text-white-50 pl-2"> 
                            network
                        </h1>
                    </div>
                </div>
                <nav className = "navbar navbar-dark btn-group">
                    {logged && <Button className = "btn-secondary btn-md" value={this.state.user.user} onclick={() => this.goToProfile(this.state.user.id)}/>}
                    <Button className = "btn-secondary btn-md" value='All Posts'onclick={this.goToAllPosts}/>
                    {logged && <Button className = "btn-secondary btn-md" value='Following' onclick={this.goToFollowing}/>}
                    {logged && <Button className = "btn-secondary btn-md" value='Log out' onclick={this.goToLogOut}/>}
                    {!logged && <Button className = "btn-secondary btn-md" value='Log in' onclick={this.goToLogIn}/>}
                    {!logged && <Button className = "btn-success btn-md" value='Register' onclick={this.goToRegister}/>}
                </nav>
                
                {this.state.page === 'register' && 
                    <Register 
                        login = {this.logIn}
                    />}
                {this.state.page === 'login' && 
                    <LogIn 
                        login = {this.logIn}
                    />}
                {this.state.page === 'allposts' && 
                    <AllPosts 
                        user={this.state.user}
                        profile={this.state.profile}
                        gotoprofile={this.goToProfile}
                    />}
                {this.state.page === 'profile' && 
                    <Profile 
                        ref={this.profileElement}
                        user={this.state.user}
                        profile={this.state.profile}
                        following={this.state.following}
                        gotoprofile={this.goToProfile}
                    />}
                {this.state.page === 'following' && 
                    <Following 
                        user={this.state.user} 
                        gotoprofile={this.goToProfile}
                    />}
            </React.Fragment>
        );
    };

};

ReactDOM.render(<Page />, document.querySelector("#root"));