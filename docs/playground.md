---
layout: page
title: Playground
description: Interactive playground to explore collect-ts methods
sidebar: false
---

<script setup>
import Playground from './.vitepress/theme/components/Playground/Playground.vue'
</script>

<div class="playground-page">

<div class="playground-header">
<h1 class="playground-title">Playground</h1>
<p class="playground-description">Experiment with collect-ts in your browser. Type code on the left, see results on the right.</p>
</div>

<Playground />

</div>

<style>
.playground-page {
	width: 100%;
	max-width: 100%;
	padding: 24px;
	box-sizing: border-box;
}

.playground-header {
	max-width: 1400px;
	margin: 0 auto 24px;
}

.playground-title {
	margin: 0 0 8px;
	font-size: 28px;
	font-weight: 700;
	letter-spacing: -0.02em;
}

.playground-description {
	margin: 0;
	font-size: 16px;
	color: var(--vp-c-text-2);
}

@media (min-width: 768px) {
	.playground-page {
		padding: 32px;
	}
	
	.playground-header {
		margin-bottom: 32px;
	}
	
	.playground-title {
		font-size: 32px;
	}
}

@media (min-width: 1024px) {
	.playground-page {
		padding: 40px;
	}
}

/* Override VitePress content container - scoped to playground page */
.playground-page {
	/* Parent selectors scope these overrides to prevent leaking on navigation */
}

:has(.playground-page) .VPDoc.has-aside .content-container,
:has(.playground-page) .VPDoc .content-container {
	max-width: 100% !important;
}

:has(.playground-page) .VPContent.has-sidebar {
	padding-left: 0 !important;
}
</style>
