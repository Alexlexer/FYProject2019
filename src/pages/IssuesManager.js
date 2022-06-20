import React, { Component, Fragment } from 'react';
import { withAuth } from '@okta/okta-react';
import { withRouter, Route, Redirect, Link } from 'react-router-dom';
import {
  withStyles,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core';
import { Delete as DeleteIcon, Add as AddIcon } from '@material-ui/icons';
import moment from 'moment';
import { find, orderBy } from 'lodash';
import { compose } from 'recompose';

import IssueEditor from '../components/IssueEditor';

const styles = theme => ({
  issues: {
    marginTop: 2 * theme.spacing.unit,
  },
  fab: {
    position: 'absolute',
    bottom: 3 * theme.spacing.unit,
    right: 3 * theme.spacing.unit,
    [theme.breakpoints.down('xs')]: {
      bottom: 2 * theme.spacing.unit,
      right: 2 * theme.spacing.unit,
    },
  },
});

const API = process.env.REACT_APP_API || 'http://localhost:3001';

class IssuesManager extends Component {
  state = {
    loading: true,
    issues: [],
  };

  componentDidMount() {
    this.getIssues();
  }

  async fetch(method, endpoint, body) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        method,
        body: body && JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${await this.props.auth.getAccessToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async getIssues() {
    this.setState({ loading: false, issues: await this.fetch('get', '/issues') });
  }

  savePost = async (post) => {
    if (post.id) {
      await this.fetch('put', `/issues/${post.id}`, post);
    } else {
      await this.fetch('post', '/issues', post);
    }

    this.props.history.goBack();
    this.getIssues();
  }

  async deletePost(post) {
    if (window.confirm(`Are you sure you want to delete "${post.title}"`)) {
      await this.fetch('delete', `/issues/${post.id}`);
      this.getIssues();
    }
  }

  renderIssueEditor = ({ match: { params: { id } } }) => {
    if (this.state.loading) return null;
    const post = find(this.state.issues, { id: Number(id) });

    if (!post && id !== 'new') return <Redirect to="/issues" />;

    return <IssueEditor post={post} onSave={this.savePost} />;
  };

  render() {
    const { classes } = this.props;

    return (
      <Fragment>
        <Typography variant="display1">Issues Manager</Typography>
        {this.state.issues.length > 0 ? (
          <Paper elevation={1} className={classes.issues}>
            <List>
              {orderBy(this.state.issues, ['updatedAt', 'title'], ['desc', 'asc']).map(post => (
                <ListItem key={post.id} button component={Link} to={`/issues/${post.id}`}>
                  <ListItemText
                    primary={post.title}
                    secondary={post.updatedAt && `Updated ${moment(post.updatedAt).fromNow()}`}
                  />
                  <ListItemText
                  primary={post.body}
                  secondary={post.priority}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => this.deletePost(post)} color="inherit">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          !this.state.loading && <Typography variant="subheading">No issues to display</Typography>
        )}
        <Button
          variant="fab"
          color="secondary"
          aria-label="add"
          className={classes.fab}
          component={Link}
          to="/issues/new"
        >
          <AddIcon />
        </Button>
        <Route exact path="/issues/:id" render={this.renderIssueEditor} />
      </Fragment>
    );
  }
}

export default compose(
  withAuth,
  withRouter,
  withStyles(styles),
)(IssuesManager);
