---
title: Git is your friend, not your enemy - Part 2
tags: [tutorial, git]
draft: true
date: 2020-01-25
_build:
  list: never
---

> This post is the second part of a tutorial series on how to use Git to its full potential. Read the first part
> [here]({{< ref git-is-your-friend-part-1 >}}).

We ended the previous part of this tutorial on merging local changes with remote changes. That last part assumed there
was no merge conflict --- a situation you may have already encountered in the wild. We will now look at how to solve
those conflicts efficiently, which becomes critical for the next part, maintaining a clean Git history using interactive
rebasing.

# Solving merge conflicts with a merge tool

Let us start with the following situation:

```txt
    C origin/master
   /
  A---B master
```

We can visualize this in our terminal:

{{< aha >}}
$ <span style="font-weight:bold;color:white;">git log --all --oneline --graph</span>
* <span style="color:olive;">d105f20</span><span style="color:olive;"> (</span><span style="font-weight:bold;color:green;">origin/master</span><span style="color:olive;">)</span> Add success return to main
<span style="color:red;">|</span> * <span style="color:olive;">836ba41</span><span style="color:olive;"> (</span><span style="font-weight:bold;color:teal;">HEAD -&gt; </span><span style="font-weight:bold;color:green;">master</span><span style="color:olive;">)</span> Add error return to main
<span style="color:red;">|</span><span style="color:red;">/</span>  
* <span style="color:olive;">a5aea3c</span> Initial commit
{{</ aha >}}

If, from the `master` branch we try to use `git pull` (effectively running `git merge origin/master`), we will end up
with the following warning from Git: <a id="conflicted-state-1"></a>

{{< aha >}}
$ <span style="font-weight:bold;color:white;">git pull</span>
From .
 * branch            origin/master -&gt; FETCH_HEAD
Auto-merging main.c
CONFLICT (content): Merge conflict in main.c
Automatic merge failed; fix conflicts and then commit the result.
{{</ aha >}}

This means --- exactly as mentioned by the Git output --- that there is no way to automatically merge changes from the
two branches being merged. Indeed, if we look at the `master` branch, this is our (local) change:

{{< aha >}}
$ <span style="font-weight:bold;color:white">git show master --oneline</span>
<span style="color:olive;">836ba41cac2a63cb2e060dfb5fdc9c6bdea82882</span> Add error return to main
<span style="font-weight:bold;">diff --git a/main.c b/main.c</span>
<span style="font-weight:bold;">index 0a502e4..dd314f9 100644</span>
<span style="font-weight:bold;">--- a/main.c</span>
<span style="font-weight:bold;">+++ b/main.c</span>
<span style="color:teal;">@@ -2,4 +2,5 @@</span>
 #include &lt;stdlib.h&gt;
 
 int main(int argc, char *argv[]) {
<span style="color:green;">+</span>	<span style="color:green;">return 1;</span>
 }
{{</ aha >}}
<!-- * -->

While the `origin/master` had those (remote) --- incompatible --- changes:

{{< aha >}}
$ <span style="font-weight:bold;color:white">git show origin/master --oneline</span>
<span style="color:olive;">d105f20e3f19cdc2786d374e73f9f4cd8aa560ec</span> Add success return to main
<span style="font-weight:bold;">diff --git a/main.c b/main.c</span>
<span style="font-weight:bold;">index 0a502e4..296c7ac 100644</span>
<span style="font-weight:bold;">--- a/main.c</span>
<span style="font-weight:bold;">+++ b/main.c</span>
<span style="color:teal;">@@ -2,4 +2,5 @@</span>
 #include &lt;stdlib.h&gt;
 
 int main(int argc, char *argv[]) {
<span style="color:green;">+</span>	<span style="color:green;">return 0;</span>
 }
{{</ aha >}}
<!-- * -->

How do we fix those changes?

## The manual (bad) way

Upon discovering the `fix conflicts and then commit the result` message from Git, the inexperience Git user might do
exactly as suggested. They would open the files in conflict one-by-one in their editor, and be greeted with this
interesting syntax:

```c
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
<<<<<<< HEAD
	return 1;
=======
	return 0;
>>>>>>> d105f20e3f19cdc2786d374e73f9f4cd8aa560ec
}
```

The `<<<`, `===` and `>>>` character sequences are called *conflict markers*, since they mark a region of the file as in
conflict. The name following `<<<` is the local revision name (`HEAD` since we are merging into the current branch), and
similarly the name following `>>>` is the remote revision name (here denoted by its commit SHA).

The first region between `<<<` and `===` contains the changes brought by the local revisions, and the second region
between `===` and `>>>` the changes from the remote revisions. To solve the merge conflict, we need to pick which region
needs to be merged in.

The *manual* way to do it is to remove the conflict markers, and the region we do not want to keep in the resulting
file. After closing the editor, running `git status` informs us of the current state of the repository:

{{< aha >}}
On branch master
Your branch and 'origin/master' have diverged,
and have 1 and 1 different commits each, respectively.
  (use &quot;git pull&quot; to merge the remote branch into yours)

You have unmerged paths.
  (fix conflicts and run &quot;git commit&quot;)
  (use &quot;git merge --abort&quot; to abort the merge)

Unmerged paths:
  (use &quot;git add &lt;file&gt;...&quot; to mark resolution)
	<span style="color:red;">both modified:   main.c</span>

no changes added to commit (use &quot;git add&quot; and/or &quot;git commit -a&quot;)
{{</ aha >}}

Indeed, writing to a file does not inform Git that the conflict has been resolved. You need to mark the conflict as
resolved with `git add main.c` (since `main.c` is the file that we resolved conflicts in) before finishing the merge
with `git commit`:

{{< aha >}}
$ <span style="font-weight:bold;color:white;">git add main.c</span>
$ <span style="font-weight:bold;color:white;">git commit --no-edit</span> <span style="color:gray"># --no-edit skips opening the editor</span>
[master 8738275] Merge branch 'origin/master'
{{</ aha >}}

***Make sure you solved all the conflicts***: if you call `git add` on a file which still has conflict markers, there
will be no warnings and you will commit corrupted files to your repository. Nothing that can't be fixed, but this is
hard to fix for future maintainers. Especially if you don't have continuous integration set up to catch those mistakes
early...

Since this process has multiple points of failure, we should try to find a *better* method, which does not have this
many pitfalls. Thankfully, Git has us covered.

## The automated (good) way

In order to automate the conflict resolution process, Git supports so-called *merge tools*: programs that will be run by
Git in order to help the user fix conflicts by picking the right options on every conflicted region. First, we need to
configure a *merge tool*. We will use the graphical tool [Meld](https://meldmerge.org/), although many others are
available[^other-merge-tools].

First, install Meld using your distribution's package manager:
```bash
# Debian/Ubuntu
$ sudo apt install meld
# Fedora
$ sudo dnf install meld
```

Then, we need to indicate to Git we want to use Meld as our merge tool:
```bash
$ git config --global merge.tool meld
```

We are now ready to go! Let's go back to the [conflicted state](#conflicted-state-1). Then, instead of fixing the
conflicts manually, we run the following command:
```bash
$ git mergetool
```

The main window of Meld opens:

![Meld initial window](meld-initial-conflict.png)

As indicated in the headers of the panels:
* The left panel represents the state of the file after local changes: this is our `master` branch we are merging into
* The middle panel is the current state of the file we are building (where conflicts are solved).
* The right panel represents the state of the file after remote changes: this is the `origin/master` branch we are
merging into the `master` branch.

Clicking on the arrows between the left (resp. right) panel will bring in the changes from the local (resp. remote)
branches:

![Meld window after conflict resolution](meld-resolved-conflicts.png)

You can then save the changes with the `Menu > Save all` option, or with `Ctrl+s`. When you have solved the conflict,
you can quit Meld and check the status of our repository:

{{< aha >}}
$ <span style="font-weight:bold;color:white;">git status</span>
On branch master
Your branch and 'origin/master' have diverged,
and have 1 and 1 different commits each, respectively.
  (use &quot;git pull&quot; to merge the remote branch into yours)

All conflicts fixed but you are still merging.
  (use &quot;git commit&quot; to conclude merge)

Changes to be committed:
	<span style="color:green;">modified:   main.c</span>

Untracked files:
  (use &quot;git add &lt;file&gt;...&quot; to include in what will be committed)
	<span style="color:red;">main.c.orig</span>
{{</ aha >}}

Two things are worth noting here:
* The `main.c` file was automatically added as all the conflicts were resolved using Meld, so we don't have to call `git
add main.c` (that's one step saved!)
* `main.c.orig` was created: this is a backup copy of `main.c` before the conflict resolution happened. We can remove
it once we're sure the merge completed successfully.

We may then complete our merge process by running `git commit`.

## Merge tools: conclusion

Using a merge tool streamlines the merge conflict resolution process by ensuring we do not miss a step --- and also
saves us a lot of typing and manually editing files. Since you will encounter merge conflicts regularly while using Git
and collaborating with other people, it's a good idea to properly set up your *merge tool* so you don't feel like
smashing your keyboard on merge conflicts.

More complicated merge conflicts might be hard to resolve though, especially when working with someone else's changes.
This is why having a clean Git history is critical, so you can look at it when resolving a merge conflict and make
informed decisions. Thankfully, Git also has us covered.

# Rewriting local history with `git rebase`

```ini
# This may equivalently be changed with `git config --global rebase.autosquash true`
[rebase]
	# Useful for git commit --fixup
	autosquash = true
```

# Bonus round: making your shell smarter

* zsh plugins for Git completion

# Conclusion

In this second part, we studied how to maintain a clean history using various more or less automated methods. Aside from
making the history human-readable, we'll see this plays a big role in some advanced uses of Git, such as `git bisect`,
which we'll see in the last part of this series.

[^other-merge-tools]: Aside from dedicated merge tools, most editors also support merge conflict resolution, either
  built-in or through plugins. Look online for instructions on how to set them up, for example for
  [Vim/Neovim](https://www.grzegorowski.com/using-vim-or-neovim-nvim-as-a-git-mergetool) and
  [Emacs](http://blog.binchen.org/posts/emacs-is-the-best-merge-tool-for-git.html).
